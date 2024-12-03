import { Ticker } from 'pixi.js';
import { GameChart } from '..';
import { onScoreTick } from './tick';
import { GameSkin } from '@/skins';
import { GameAudioChannel } from '@/audio/channel';
import { GameChartNote } from '../note';
import { EGameChartScoreJudgeType } from './types';
import { GameChartScoreInputs } from './inputs';

interface IGameScoreJudgeRange {
  readonly perfect: number,
  readonly good: number,
  readonly bad: number,
}

interface IGameScoreJudgeCount extends Array<number> {
  /** Perfect */
  3: number,
  /** Good */
  2: number,
  /** Bad */
  1: number,
  /** Miss */
  0: number,
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
  readonly notes: GameChartNote[];
  readonly skin: GameSkin;
  readonly audioChannel: GameAudioChannel;
  readonly ticker: Ticker = new Ticker();
  readonly notesCount: number;

  readonly inputs: GameChartScoreInputs;

  readonly onScoreTick: () => void;

  private readonly scorePerNote: number;
  private readonly scorePerCombo: number;
  private readonly scorePerComboGood: number;
  private readonly judgeRange: IGameScoreJudgeRange;
  private readonly isAutoPlay: boolean;
  private readonly judgeCount: IGameScoreJudgeCount = [ 0, 0, 0, 0 ];

  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private scoredNotes: number = 0;
  private accurate: number = 0;
  private accurateText: string = '0.00%';

  constructor(chart: GameChart) {
    this.chart = chart;
    this.notes = this.chart.data.notes;
    this.notesCount = this.notes.length; // TODO: Fake notes

    const { skins, audio, options } = this.chart.game;
    this.skin = skins.currentSkin!;
    this.audioChannel = audio.channels.effect;

    if (options.challengeMode) {
      this.judgeRange = ScoreJudgeRanges.challenge;
      this.scorePerNote = 1000000 / this.notesCount;
      this.scorePerCombo = 0;
    } else {
      this.judgeRange = ScoreJudgeRanges.normal;
      this.scorePerNote = 900000 / this.notesCount;
      this.scorePerCombo = 100000 / this.notesCount;
    }
    this.scorePerComboGood = this.scorePerNote * 0.65;
    this.isAutoPlay = options.autoPlay;

    this.inputs = new GameChartScoreInputs(this.chart.game);
    this.onScoreTick = onScoreTick.bind(this);
  }

  private updateScore(type: EGameChartScoreJudgeType) {
    if (this.isAutoPlay) this.judgeCount[3] += 1;
    else this.judgeCount[type] += 1;

    if (type >= EGameChartScoreJudgeType.GOOD) {
      this.scoredNotes += 1;
      this.combo += 1;
      if (this.maxCombo < this.combo) this.maxCombo = this.combo;
    } else {
      // TODO: Line status
      this.combo = 0;
    }

    this.score = Math.round(
      (this.scorePerNote + this.scoredNotes) +
      (this.judgeCount[3] * this.scorePerCombo) + (this.judgeCount[2] * this.scorePerComboGood)
    );
    this.accurate = (this.judgeCount[3] + this.judgeCount[2] * 0.65) / this.notesCount;
    this.accurateText = `${this.accurate * 100}`;
  }
}
