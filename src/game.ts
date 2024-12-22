import { AutoDetectOptions } from 'pixi.js';
import { GameAudio } from './audio';
import { GameRenderer } from './renderer';
import { GameSkins } from './skins';
import { GameStage } from './stage';
import { GameFiles } from './files';
import { GameChart } from './chart';
import { EGameScoreJudgeType } from './score/types';
import { GameStorage } from './storage';
import { GameDatabase } from './database';
import { IFileAudio, IFileChart, IFileImage, TChartInfo } from './utils/types';

export class Game {
  // TODO: Use another class to manage it
  private videoOptions: Partial<AutoDetectOptions> = {};
  readonly options = {
    useHighQualitySkin: true,
    useHighlight: true,
    challengeMode: false,
    autoPlay: true,
  };

  readonly storage: GameStorage = new GameStorage();
  readonly database: GameDatabase = new GameDatabase(this.storage);
  readonly renderer: GameRenderer = new GameRenderer(this);
  readonly skins: GameSkins = new GameSkins(this);
  readonly stage: GameStage = new GameStage(this);
  readonly audio: GameAudio = new GameAudio();
  readonly files: GameFiles = new GameFiles();

  chart?: GameChart;

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

  startChart(chartInfo: TChartInfo) {return new Promise(async (res) => {
    const chartFilesMD5: string[] = [
      chartInfo.chart,
      chartInfo.audio,
      chartInfo.image ? chartInfo.image : '',
      ...chartInfo.extraFiles
    ];
    const chartFiles = await this.storage.getDecodedFilesByMD5(chartFilesMD5);
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
      (chartFiles.find((e) => e.md5 === chartInfo.chart)!.file as IFileChart).data,
      (chartFiles.find((e) => e.md5 === chartInfo.audio)!.file as IFileAudio).data,
      (chartFiles.find((e) => e.md5 === chartInfo.image)!.file as IFileImage).data ?? (void 0)
    );
    this.chart.audio.setChannel(this.audio.channels.music);

    this.renderer.containers.game.sortChildren();
    this.chart.reszie(this.renderer.size);
    this.chart.start();

    res(this.chart);
    console.log(this);
  })}

  pauseChart() {
    if (!this.chart) return;
    const { chart, stage } = this;
    const { audio } = chart;

    audio.pause();
    stage.set('pausing');
    stage.stages.pausing.updateData(audio.pauseTime - audio.startTime, audio.source.duration);
  }

  resumeChart() {
    if (!this.chart) return;
    this.chart.audio.play();
    this.stage.set(null);
  }

  restartChart() {
    if (!this.chart) return;
    const { chart, stage } = this;
    const { audio } = chart;

    audio.stop();
    chart.reset();
    chart.reszie(this.renderer.size);
    audio.play();

    stage.set(null);
  }

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
