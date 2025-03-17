import { Ticker } from 'pixi.js';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { RecorderClock } from './clock';
import { onRecordTick } from './tick';
import * as Overlay from '@/utils/overlay';
import { Game } from '@/game';

export class GameRecorder {
  options = {
    fps: 60,
    width: 1920,
    height: 1080,
  };

  readonly game: Game;

  readonly clock = new RecorderClock();
  readonly ffmpeg = new FFmpeg();
  readonly ticker: Ticker;

  readonly tick: typeof onRecordTick;
  _beginFrame = 0;

  constructor(game: Game) {
    this.game = game;

    this.ffmpeg.on('log', (e) => {
      console.debug('[FFmpeg]', e.message);
      Overlay.setSubtitle(e.message);
    });

    // We will manually ticking
    this.ticker = new Ticker();
    this.ticker.autoStart = false;
    this.ticker.stop();

    this.tick = onRecordTick.bind(this);
    this.ticker.add(this.tick);
  }

  start() {
    const {
      chart,
      renderer,
    } = this.game;
    if (!chart) return;

    this.clock.fps = this.options.fps;
    this.clock.length = chart.audio.duration;

    this.resize();
    chart.reszie(renderer.size);

    Overlay.show();
    Overlay.setTitle('Recording...');
    Overlay.setSubtitle('Loading FFmpeg...');

    this.ffmpeg
      .load()
      .then(() => {
        Overlay.setSubtitle('Rendering...');
        this.ticker.update();
      })
      .catch((e) => {
        Overlay.setSubtitle(`Failed to load FFmpeg: ${e.toString()}`);
        console.error(e);
      });
  }

  resize() {
    const { game, options } = this;
    const { width, height } = options;

    game.renderer.resize(width, height, 1);
    if (game.chart) game.chart.reszie(game.renderer.size);
  }
}
