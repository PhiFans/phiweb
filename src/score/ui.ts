import { Game } from '@/game';
import { IGameRendererSize } from '@/renderer';
import { TGameSkinElement, TGameSkinElementAnchored, TGameSkinElementCoordinate, TGameSkinElementStickTo, TGameSkinElementTypeText } from '@/skins/types';
import { GameUITexturedNumber } from '@/ui/textured-number';
import { parseDoublePrecist } from '@/utils/math';
import { TChartInfo } from '@/utils/types';
import { Container, Sprite, Text } from 'pixi.js';

type TGameScoreUIElementBase = TGameSkinElement & {
  sprite: unknown,
};

type TGameScoreUIElementNumber = TGameScoreUIElementBase & {
  type: 'score' | 'combo' | 'accurate',
  sprite: GameUITexturedNumber,
};

type TGameScoreUIElementTexture = TGameScoreUIElementBase & {
  type: 'combo-text' | 'image' | 'pause-button' | 'progress-bar',
  sprite: Sprite,
};

type TGameScoreUIElementText = TGameScoreUIElementBase & {
  type: TGameSkinElementTypeText,
  sprite: Text,
};

type TGameScoreUIElement = TGameScoreUIElementNumber | TGameScoreUIElementTexture | TGameScoreUIElementText;

const accurateToText = (number: number) => `${parseDoublePrecist(number * 100, 2)}%`;

export class GameScoreUI {
  readonly game: Game;
  readonly info: TChartInfo;
  readonly gameSize: IGameRendererSize;
  readonly container = new Container();
  readonly elements: TGameScoreUIElement[] = [];
  private readonly elementStats = {
    lastPauseClick: 0,
    pauseClickCount: 0,
  };

  constructor(game: Game, info: TChartInfo) {
    this.game = game;
    this.info = info;

    const { skins, renderer, options } = this.game;
    const { size, containers } = renderer;
    this.gameSize = size;
    const skin = skins.currentSkin!;

    this.elements = [ ...skin.elements ]
      .filter(e => e.type !== 'hit-effect')
      .map<TGameScoreUIElement | undefined>((e) => {
        if (e.type === 'animation') return void 0; // TODO: We will work on that later.
        const result: Partial<TGameScoreUIElement> & Omit<TGameScoreUIElement, 'sprite'> = { ...e };

        switch (e.type) {
          case 'score':
          case 'combo':
          case 'accurate': {
            result.sprite = new GameUITexturedNumber(e, e.type === 'score' ? 7 : 0);
            break;
          };
          case 'combo-text': {
            result.sprite = new Sprite(options.autoPlay ? e.texture!['autoplay'] : e.texture!['normal']);
            break;
          }
          case 'song-name': // TODO: Song info
          case 'song-level':
          case 'song-artist': {
            result.sprite = new Text({
              text: (
                e.type === 'song-name' ? this.info.name :
                e.type === 'song-artist' ? this.info.artist :
                this.info.level
              ),
              style: {
                fontFamily: e.fontFamily,
                fontSize: e.size,
                align: e.align,
                fill: 0xFFFFFF,
              },
            });
            break;
          }
          case 'pause-button': {
            const sprite = new Sprite(e.texture!);
            sprite.interactive = true;
            sprite.eventMode = 'static';
            sprite.on('pointerdown', () => this.onButtonPauseClick());

            result.sprite = sprite;
            break;
          }
          case 'text': {
            result.sprite = new Text({
              text: e.text,
              style: {
                fontFamily: e.fontFamily,
                fontSize: e.size,
                align: e.align,
                fill: 0xFFFFFF,
              },
            });
            break;
          }
          case 'progress-bar': {
            result.sprite = new Sprite(e.texture!);
            break;
          }
        }

        if (!result.sprite) {
          console.warn(`No such element type: ${e.type}, skipping...`);
          return (void 0);
        }

        // TODO: Progress bar
        if (e.type !== 'pause-button') result.sprite.interactive = result.sprite.interactiveChildren = false;
        if (e.alpha) result.sprite.alpha = e.alpha;
        if ((e as TGameSkinElementAnchored).anchor && (result.sprite as Sprite | Text).anchor) {
          const { anchor } = (e as TGameSkinElementAnchored);
          (result.sprite as Sprite | Text).anchor.set(anchor.x, anchor.y);
        }

        return result as TGameScoreUIElement;
      })
      .filter((e) => (e !== (void 0)));

    for (const e of this.elements) this.container.addChild(e.sprite);
    containers.ui.addChild(this.container);
    this.resize(size);
  }

  resize(size: IGameRendererSize) {
    const { elements } = this;
    const { heightPercent } = size;

    for (const e of elements) {
      const { stickTo, position, scale, sprite } = e;
      const newPos = this.calculatePosition(size, stickTo, position);
      sprite.scale.set(heightPercent * (scale || 1));
      sprite.position.set(newPos.x, newPos.y);
    }
  }

  updateUIScore(score: number, combo: number, accurate: number) {
    const { elements } = this;
    const accurateText = accurateToText(accurate);

    for (const e of elements) {
      const { type, sprite } = e;
      switch (type) {
        case 'score':
          sprite.number = score;
          break;
        case 'combo':
          sprite.number = combo;
          if (e.autoHide) {
            if (combo > 2 && !sprite.visible) sprite.visible = true;
            else if (combo <= 2 &&sprite.visible) sprite.visible = false;
          }
          break;
        case 'accurate':
          sprite.number = accurateText;
          break;
        case 'combo-text':
          if (e.autoHide) {
            if (combo > 2 && !sprite.visible) sprite.visible = true;
            else if (combo <= 2 && sprite.visible) sprite.visible = false;
          }
          break;
      }
    }
  }

  updateUIProgress(progress: number) {
    const { elements, gameSize } = this;
    for (const element of elements) {
      if (element.type !== 'progress-bar') continue;
      const { stickTo, stickToEnd, position, positionEnd } = element;
      const startPos = this.calculatePosition(gameSize, stickTo, position);
      const endPos = this.calculatePosition(gameSize, stickToEnd, positionEnd);

      element.sprite.position.set(
        startPos.x * (1 - progress) + endPos.x * progress,
        startPos.y * (1 - progress) + endPos.y * progress
      );
    }
  }

  /**
   * **[Note]**: With width offset
   */
  private calculatePosition(size: IGameRendererSize, stickTo: TGameSkinElementStickTo, position: TGameSkinElementCoordinate): TGameSkinElementCoordinate {
    const { heightPercent, widthOffset, width, widthHalf, height, heightHalf } = size;
    const posXPercent = position.x * heightPercent;
    const posYPercent = position.y * heightPercent;

    const posX = widthOffset + (
      stickTo.x === 'left' ? posXPercent :
      stickTo.x === 'center' ? widthHalf + posXPercent :
      width - posXPercent
    );
    const posY = (
      stickTo.y === 'top' ? posYPercent :
      stickTo.y === 'center' ? heightHalf + posYPercent :
      height - posYPercent
    );
    return { x: posX, y: posY };
  }

  private onButtonPauseClick() {
    const { elementStats } = this;
    const currentTime = performance.now();

    if (currentTime - elementStats.lastPauseClick <= 200) {
      elementStats.lastPauseClick = currentTime;
      elementStats.pauseClickCount++;

      if (elementStats.pauseClickCount >= 2) {
        this.game.pauseChart();
        elementStats.lastPauseClick = 0;
        elementStats.pauseClickCount = 0;
      }
    } else {
      elementStats.lastPauseClick = currentTime;
      elementStats.pauseClickCount = 1;
    }
  }
}
