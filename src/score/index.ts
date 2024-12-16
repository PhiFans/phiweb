import { GameChart } from '../chart';
import { onScoreTick } from './tick';
import { GameChartNote } from '../chart/note';
import { EGameScoreJudgeType } from './types';
import { GameChartScoreInputs } from './inputs';
import { GameChartScoreJudge } from './judge';
import { Container } from 'pixi.js';
import { GameScoreEffects } from './effects';
import { IGameRendererSize } from '@/renderer';
import { GameScoreUI } from './ui';
import { GameSkin } from '@/skins';

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

/**
 * NOTE: We don't need any `createSprites` for `GameScore`
 */
export class GameScore {
  readonly chart: GameChart;
  readonly notes: GameChartNote[];
  readonly notesCount: number;

  readonly size: IGameRendererSize;
  readonly ui: GameScoreUI;
  readonly effects: GameScoreEffects;
  readonly inputs: GameChartScoreInputs;
  readonly judges: GameChartScoreJudge[] = [];
  readonly onScoreTick: (currentTime: number) => void;

  private readonly scorePerCombo: number;
  private readonly scorePerNote: number;
  private readonly scorePerNoteGood: number;
  readonly judgeRange: IGameScoreJudgeRange;
  readonly isAutoPlay: boolean;
  private readonly judgeCount: IGameScoreJudgeCount = [ 0, 0, 0, 0 ];

  score: number = 0;
  combo: number = 0;
  maxCombo: number = 0;
  accurate: number = 0;
  private scoredNotes: number = 0;

  constructor(chart: GameChart, skin: GameSkin, containers: { game: Container, ui: Container }) {
    this.chart = chart;
    this.notes = this.chart.data.notes;
    this.notesCount = this.chart.data.notesTotalReal;

    const { game } = this.chart;
    const { renderer, audio, options } = game;
    this.size = renderer.size;
    this.ui = new GameScoreUI(game);
    this.effects = new GameScoreEffects(
      skin,
      containers.game,
      audio.channels.effect,
      this.size
    );

    if (options.challengeMode) {
      this.judgeRange = ScoreJudgeRanges.challenge;
      this.scorePerCombo = 1000000 / this.notesCount;
      this.scorePerNote = 0;
    } else {
      this.judgeRange = ScoreJudgeRanges.normal;
      this.scorePerCombo = 900000 / this.notesCount;
      this.scorePerNote = 100000 / this.notesCount;
    }
    this.scorePerNoteGood = this.scorePerNote * 0.65;
    this.isAutoPlay = options.autoPlay;

    this.inputs = new GameChartScoreInputs(this.chart.game);
    this.onScoreTick = onScoreTick.bind(this);

    this.ui.updateUI(this.score, this.combo, this.accurate);
  }

  resize(size: IGameRendererSize) {
    this.ui.resize(size);
  }

  updateScore(type: EGameScoreJudgeType) {
    const { isAutoPlay, judgeCount, scorePerCombo, scorePerNote, scorePerNoteGood, ui } = this;

    this.scoredNotes++;
    if (isAutoPlay) judgeCount[3] += 1;
    else judgeCount[type] += 1;

    if (type >= EGameScoreJudgeType.GOOD) {
      this.combo += 1;
      if (this.maxCombo < this.combo) this.maxCombo = this.combo;
    } else {
      // TODO: Line status
      this.combo = 0;
    }

    this.score = Math.round(
      (this.maxCombo * scorePerCombo) +
      (scorePerNote * judgeCount[3] + scorePerNoteGood * judgeCount[2])
    );
    this.accurate = (judgeCount[3] + judgeCount[2] * 0.65) / this.scoredNotes;

    ui.updateUI(this.score, this.combo, this.accurate);
  }

  reset() {
    this.scoredNotes = 0;

    this.judgeCount[0] = 0;
    this.judgeCount[1] = 0;
    this.judgeCount[2] = 0;
    this.judgeCount[3] = 0;

    this.combo = 0;
    this.maxCombo = 0;

    this.score = 0;
    this.accurate = 0;

    this.judges.length = 0;
    this.inputs.reset();

    this.ui.updateUI(0, 0, 1);
    this.effects.reset();
  }
}
