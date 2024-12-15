import { AutoDetectOptions } from 'pixi.js';
import { GameAudio } from './audio';
import { GameRenderer } from './renderer';
import { GameSkins } from './skins';
import { GameStage } from './stage';
import { GameFiles } from './files';
import { GameChart } from './chart';
import { GameChartData } from './chart/data';
import { GameAudioClip } from './audio/clip';
import { EGameScoreJudgeType } from './score/types';

export class Game {
  readonly renderer: GameRenderer = new GameRenderer(this);
  readonly skins: GameSkins = new GameSkins(this);
  readonly stage: GameStage = new GameStage(this);
  readonly audio: GameAudio = new GameAudio();
  readonly files: GameFiles = new GameFiles();

  chart?: GameChart;

  // TODO: Use another class to manage it
  options = {
    useHighQualitySkin: true,
    useHighlight: true,
    challengeMode: false,
    autoPlay: true,
  };
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

  startChart(chartData: GameChartData, audio: GameAudioClip) {return new Promise(async (res) => {
    const { options, skins } = this;
    const { currentSkin } = skins;
    if (!currentSkin) {
      console.error('No skin loaded');
      return;
    }
    await currentSkin.create(options.useHighQualitySkin);
    this.stage.set(null);

    this.chart = new GameChart(
      this,
      chartData,
      audio,
      (void 0)
    );
    this.chart.audio.setChannel(this.audio.channels.music);

    this.renderer.containers.game.sortChildren();
    this.chart.reszie(this.renderer.size);
    this.chart.start();

    res(this.chart);
    console.log(this);
  })}

  /**
   * @param seconds Seek seconds
   */
  seekChart(seconds: number) {
    if (!this.chart) return;
    if (!this.options.autoPlay) return;

    const seekTime = seconds * 1000;
    const { data, audio, score } = this.chart;
    const { lines, notes } = data;

    audio.seek(seconds);
    score.reset();

    for (const line of lines) line.reset();
    for (const note of notes) {
      note.reset();
      if (
        note.time <= seekTime &&
        (note.type !== 3 || note.holdEndTime! <= seekTime)
      ) {
        note.score.isScored = true;
        note.score.isScoreAnimated = true;
        note.score.score = EGameScoreJudgeType.PERFECT;
        if (note.sprite!.parent) note.sprite!.removeFromParent();
      }
    }

    this.chart.reszie(this.renderer.size);
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
