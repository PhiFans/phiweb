import { AutoDetectOptions } from 'pixi.js';
import { GameAudio } from './audio';
import { GameRenderer } from './renderer';
import { GameSkins } from './skins';
import { GameStage } from './stage';
import { GameFiles } from './files';
import { GameChart } from './chart';
import { GameChartData } from './chart/data';
import { GameAudioClip } from './audio/clip';

export class Game {
  readonly renderer: GameRenderer = new GameRenderer();
  readonly skins: GameSkins = new GameSkins(this);
  readonly stage: GameStage = new GameStage(this);
  readonly audio: GameAudio = new GameAudio();
  readonly files: GameFiles = new GameFiles();

  chart?: GameChart;

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

  startChart(chartData: GameChartData, audio: GameAudioClip) {
    this.chart = new GameChart(
      this,
      chartData,
      audio,
      (void 0),
    );
    this.chart.audio.setChannel(this.audio.channels.music);

    this.chart.createSprites(this.renderer.containers.game);
    this.renderer.containers.game.sortChildren();

    this.chart.reszie(this.renderer.size);
    this.chart.start();

    console.log(this);
  }

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

    this.renderer.resize(clientWidth, clientHeight, resolution);
    this.stage.resize(clientWidth, clientHeight);
    if (this.chart) this.chart.reszie(this.renderer.size);
  }
}
