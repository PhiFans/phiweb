import { Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import { GameChartData } from './data';
import { GameAudioClip } from '@/audio/clip';
import { GameScore } from '../score';
import { onChartTick } from './tick';
import { Game } from '@/game';
import { IGameRendererSize } from '@/renderer';
import { TChartInfo } from '@/utils/types';
import { blurImage } from '@/utils/file';

const setSpriteProps = (sprite: Sprite, zIndex = 1) => {
  sprite.interactive = sprite.interactiveChildren = false;
  sprite.tint = 0x000000;
  sprite.anchor.set(0.5);
  sprite.zIndex = zIndex;
  return sprite;
};

const resizeBgSprite = (sprite: Sprite, width: number, height: number) => {
  const { texture } = sprite;
  const scaleX = width / texture.width;
  const scaleY = height / texture.height;
  sprite.scale.set(Math.max(scaleX, scaleY));
};

export class GameChart {
  readonly game: Game;
  readonly info: TChartInfo;
  readonly data: GameChartData;
  readonly audio: GameAudioClip;
  readonly score: GameScore;
  readonly background?: ImageBitmap;
  readonly ticker: Ticker = new Ticker();

  private _bgTexture?: Texture;
  private _bgSprite?: Sprite;
  private _bgSpriteCover!: Sprite;
  private _bgCoverMask: Graphics = new Graphics();

  readonly onChartTick: (currentTime: number, container: Container) => void;

  constructor(game: Game, info: TChartInfo, data: GameChartData, audio: GameAudioClip, background?: ImageBitmap) {
    this.game = game;
    this.info = info;
    this.data = data;
    this.audio = audio;
    this.background = background;

    const { renderer, skins } = this.game;
    this.score = new GameScore(this, skins.currentSkin!, renderer.containers);

    // Create background image sprites
    if (this.background) {
      this._bgSprite = new Sprite(Texture.WHITE);
      this._bgSprite.alpha = 0.5; // TODO: Settings
      setSpriteProps(this._bgSprite);
    }
    this._bgSpriteCover = new Sprite(Texture.WHITE);
    this._bgSpriteCover.mask = this._bgCoverMask;
    setSpriteProps(this._bgSpriteCover, 2);

    if (this.background) blurImage(this.background, 20) // TODO: Settings
      .then((imageBitmap) => {
        this._bgTexture = Texture.from(imageBitmap);

        this._bgSprite!.texture = this._bgTexture;
        this._bgSpriteCover.texture = this._bgTexture;
        this._bgSprite!.tint = this._bgSpriteCover.tint = 0xFFFFFF;

        // That's how Promise works
        this.reszie(renderer.size);
      });

    if (this._bgSprite) renderer.containers.game.addChild(this._bgSprite);
    renderer.containers.ui.addChild(this._bgSpriteCover);

    this.data.createSprites(renderer.containers.game, this.game, skins.currentSkin!);

    this.onChartTick = onChartTick.bind(this);
    this.onTick = this.onTick.bind(this);
  }

  reszie(sizer: IGameRendererSize) {
    const { data } = this;

    if (this._bgSprite) resizeBgSprite(this._bgSprite, sizer.width, sizer.height);
    if (sizer.widthOffset > 0) {
      resizeBgSprite(this._bgSpriteCover, sizer.widthReal, sizer.height);
      this._bgSpriteCover.position.set(sizer.widthRealHalf, sizer.heightHalf);
      this._bgSpriteCover.visible = true;

      this._bgCoverMask
        .clear()
        .rect(0, 0, sizer.widthOffset, sizer.height)
        .rect(sizer.widthReal - sizer.widthOffset, 0, sizer.widthOffset, sizer.height)
        .fill(0xFFFFFF);
    } else this._bgSpriteCover.visible = false;

    // TODO: Skin loader
    const lineScaleX = Math.round((4000 / 1920) * (sizer.width / 1350) * 1920);
    const lineScaleY = Math.round((sizer.lineScale * 18.75 * 0.008));
    for (const line of data.lines) {
      line.sprite!.scale.set(lineScaleX, lineScaleY);
    }

    for (const note of data.notes) {
      if (note.type === 3) {
        const { isOfficial } = note;
        const holdLength = (isOfficial ? note.holdTime! / 1000 : note.holdLength!) * note.speed * sizer.noteSpeed / sizer.noteScale;

        note.sprite!.children[0].visible = true;
        note.sprite!.children[1].scale.y = 1;
        note.sprite!.children[1].height = holdLength;
        note.sprite!.children[2].position.y = -holdLength
      }

      note.sprite!.scale.set(sizer.noteScale * note.scaleX, sizer.noteScale);
    }

    this.score.resize(sizer);
  }

  start(playOffsetFix: number = 0) {
    this.ticker.add(this.onTick);
    this.ticker.start();

    this.game.audio.channels.effect.startTicker();
    this.audio.play(playOffsetFix);
  }

  reset() {
    const { data, score } = this;
    data.reset();
    score.reset();
  }

  private onTick() {
    const { data, audio, ticker } = this;
    const { startTime, pauseTime, clock, status } = audio;
    const { time } = clock;
    const { offset, container } = data;

    if (status === 0) return;
    const currentTime = ((status === 2 ? pauseTime : time) - (startTime || time)) - offset;

    this.onChartTick(currentTime, container!);
    if (status === 1) this.score.onScoreTick(currentTime, ticker.elapsedMS);
    this.score.ui.updateUIProgress(currentTime / audio.duration);
  }
}
