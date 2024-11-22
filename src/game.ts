import { AutoDetectOptions } from 'pixi.js';
import { GameAudio } from './audio';
import { GameRenderer } from './renderer';
import { GameStage } from './stage';

export class Game {
  readonly renderer: GameRenderer = new GameRenderer();
  readonly stage: GameStage = new GameStage(this);
  readonly audio: GameAudio = new GameAudio();

  private videoOptions: Partial<AutoDetectOptions> = {};

  constructor() {
    this.resize = this.resize.bind(this);
  }

  init(videoOptions?: Partial<AutoDetectOptions>) {return new Promise((res, rej) => {
    if (videoOptions) this.videoOptions = videoOptions;
    else this.videoOptions = {};

    this.renderer.init(this.videoOptions)
      .then(() => {
        this.resize();
        window.addEventListener('resize', this.resize);
        res(void 0);
      })
      .catch((e) => rej(e));
  });}

  get resolution() {
    return this.videoOptions.resolution || window.devicePixelRatio;
  }

  set resolution(value: number) {
    this.videoOptions.resolution = value;
    this.resize();
  }

  private resize() {
    const { resolution } = this;
    const { clientWidth, clientHeight } = document.documentElement;

    this.renderer.renderer.resolution = resolution;
    this.renderer.resize(clientWidth, clientHeight);

    this.stage.resize(clientWidth, clientHeight);
  }
}
