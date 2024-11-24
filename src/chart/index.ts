import { Container, Ticker } from 'pixi.js';
import { GameChartData } from './data';
import { GameAudioClip } from '@/audio/clip';
import { onChartTick } from './tick';
import { Game } from '@/game';

export class GameChart {
  readonly game: Game;
  readonly data: GameChartData;
  readonly audio: GameAudioClip;
  // TODO: Maybe `PIXI.Sprite`
  readonly background: unknown;
  readonly ticker: Ticker = new Ticker();

  readonly onChartTick: () => void;

  constructor(game: Game, data: GameChartData, audio: GameAudioClip, background: unknown) {
    this.game = game;
    this.data = data;
    this.audio = audio;
    this.background = background;

    this.onChartTick = onChartTick.bind(this);
  }

  createSprites(container: Container) {
    this.data.createSprites(container);
  }

  start() {
    this.ticker.add(this.onChartTick);
    this.ticker.start();

    this.audio.play();
  }
}
