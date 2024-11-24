import { Ticker } from 'pixi.js';
import { resumeAudioCtx } from './utils';

export class GameAudioClock {
  /**
   * The current audio time.
   */
  public time: number = 0;

  private offsets: number[] = new Array();
  private sum: number = 0;

  private readonly audioCtx: AudioContext;
  private readonly ticker: Ticker;

  constructor(audioCtx: AudioContext, ticker: Ticker) {
    this.audioCtx = audioCtx;
    this.ticker = ticker;

    this.calcTick = this.calcTick.bind(this);
    this.init();
  }

  private async init() {
    this.audioCtx.addEventListener('statechange', () => {
      if (this.audioCtx.state === 'running') this.ticker.add(this.calcTick);
    });

    await resumeAudioCtx(this.audioCtx);
    this.ticker.start();
  }

  private calcTick() {
    const realTime = performance.now();
    const delta = realTime - (this.audioCtx.currentTime * 1000);

    this.offsets.push(delta);
    this.sum += delta;

    while(this.offsets.length > 60) {
      this.sum -= this.offsets.shift()!;
    }

    this.time = realTime - this.sum / this.offsets.length;
  }
}
