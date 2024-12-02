import { Container, Ticker } from 'pixi.js';
import { GameChartData } from './data';
import { GameAudioClip } from '@/audio/clip';
import { GameChartScore } from './score';
import { onChartTick } from './tick';
import { Game } from '@/game';
import { IGameRendererSize } from '@/renderer';

export class GameChart {
  readonly game: Game;
  readonly data: GameChartData;
  readonly audio: GameAudioClip;
  readonly score: GameChartScore;
  // TODO: Maybe `PIXI.Sprite`
  readonly background: unknown;
  readonly ticker: Ticker = new Ticker();

  readonly onChartTick: () => void;

  constructor(game: Game, data: GameChartData, audio: GameAudioClip, background: unknown) {
    this.game = game;
    this.data = data;
    this.audio = audio;
    this.score = new GameChartScore(this);
    this.background = background;

    this.onChartTick = onChartTick.bind(this);
  }

  createSprites(container: Container) {
    this.data.createSprites(container, this.game);
  }

  reszie(sizer: IGameRendererSize) {
    const { data } = this;

    // TODO: Skin loader
    const lineScaleX = Math.round((4000 / 1920) * (sizer.width / 1350) * 1920);
    const lineScaleY = Math.round((sizer.lineScale * 18.75 * 0.008));
    for (const line of data.lines) {
      line.sprite!.scale.set(lineScaleX, lineScaleY);
    }

    for (const note of data.notes) {
      if (note.type === 3) {
        // TODO: Support of the non-official hold rendering
        const holdLength = ((note.holdTime! / 1000) * note.speed) * sizer.noteSpeed / sizer.noteScale;
        note.sprite!.children[1].height = holdLength;
        note.sprite!.children[2].position.y = -holdLength
      }

      note.sprite!.scale.set(sizer.noteScale);
    }
  }

  start() {
    this.ticker.add(this.onChartTick);
    this.ticker.start();

    this.audio.play();
  }
}
