import { Ticker } from 'pixi.js';
import { RecorderClock } from './clock';
import { onRecordTick } from './tick';
import { Game } from '@/game';

export class GameRecorder {
  options = {
    fps: 60,
    width: 1920,
    height: 1080,
  };

  readonly game: Game;

  readonly clock = new RecorderClock();
  readonly ticker: Ticker;

  readonly tick: typeof onRecordTick;

  constructor(game: Game) {
    this.game = game;

    // We will manually ticking
    this.ticker = new Ticker();
    this.ticker.autoStart = false;
    this.ticker.stop();

    this.tick = onRecordTick.bind(this);
  }

  start() {
    const {
      chart
    } = this.game;
    if (!chart) return;

    this.resize();
  }

  resize() {
    const { game, options } = this;
    const { width, height } = options;

    game.renderer.resize(width, height, 1);
    if (game.chart) game.chart.reszie(game.renderer.size);
  }
}
