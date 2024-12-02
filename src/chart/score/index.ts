import { Ticker } from 'pixi.js';
import { GameChart } from '..';
import { GameSkin } from '@/skins';
import { GameAudioChannel } from '@/audio/channel';

interface IGameScoreJudgeRange {
  readonly perfect: number,
  readonly good: number,
  readonly bad: number,
}

const ScoreJudgeRanges: {
  readonly normal: IGameScoreJudgeRange,
  readonly challenge: IGameScoreJudgeRange
} = {
  normal: {
    perfect: 80,
    good: 160,
    bad: 180,
  },
  challenge: {
    perfect: 40,
    good: 75,
    bad: 90,
  }
};

export class GameChartScore {
  readonly chart: GameChart;
  readonly skin: GameSkin;
  readonly audioChannel: GameAudioChannel;
  readonly ticker: Ticker = new Ticker();

  private readonly judgeRange: IGameScoreJudgeRange;
  private readonly isAutoPlay: boolean;

  private score: number = 0;
  private accurate: number = 0;
  private accurateText: string = '0.00%';
  private readonly judgeCount = {
    perfect: 0,
    good: 0,
    bad: 0,
    miss: 0,
  };

  constructor(chart: GameChart) {
    this.chart = chart;

    const { skins, audio, options } = this.chart.game;
    this.skin = skins.currentSkin!;
    this.audioChannel = audio.channels.effect;

    if (options.challengeMode) this.judgeRange = ScoreJudgeRanges.challenge;
    else this.judgeRange = ScoreJudgeRanges.normal;
    this.isAutoPlay = options.autoPlay;
  }
}
