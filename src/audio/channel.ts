import { Ticker } from 'pixi.js';
import { GameAudio } from '.';

export class GameAudioChannel {
  private readonly audioCtx: AudioContext;
  private readonly ticker: Ticker;
  private readonly gain: GainNode;
  readonly playlist: Array<unknown> = new Array();

  private isTickerStarted = false;

  constructor(audio: GameAudio, ticker: Ticker) {
    this.audioCtx = audio.audioCtx;
    this.ticker = ticker;

    this.gain = this.audioCtx.createGain();
    this.gain.connect(audio.masterGain.gain);

    this.calcTick = this.calcTick.bind(this);
  }

  startTicker() {
    if (this.isTickerStarted) return;
    this.ticker.add(this.calcTick);
    this.isTickerStarted = true;
  }

  stopTicker() {
    if (!this.isTickerStarted) return;
    this.ticker.remove(this.calcTick);
    this.isTickerStarted = false;
  }

  private calcTick() {
    while(this.playlist.length > 0) {
      const audio = this.playlist.shift()!;
    }
  }

  get volume() {
    return this.gain.gain.value;
  }

  set volume(value: number) {
    this.gain.gain.value = value;
  }

  get distance() {
    return this.gain.gain;
  }
}
