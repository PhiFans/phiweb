import { GameChartScore } from '.';
import { GameChartScoreJudge } from './judge';
import { EGameChartScoreJudgeType } from './types';

const isInArea = (
  pointX: number,
  pointY: number,
  noteX: number,
  noteY: number,
  cosr: number,
  sinr: number,
  width: number
) => {
  return Math.abs((pointX - noteX) * cosr + (pointY - noteY) * sinr) <= width;
};

export function onScoreTick(this: GameChartScore, currentTime: number) {
  const { notes, inputs, judges, judgeRange, isAutoPlay, size } = this;
  const { list: inputList } = inputs;

  judges.length = 0;
  if (!isAutoPlay) for (const input of inputList) {
    if (!input.isTapped) judges[judges.length] = new GameChartScoreJudge(1, input.x, input.y, input);
    if (input.isFlickable && !input.isFlicked) judges[judges.length] = new GameChartScoreJudge(2, input.x, input.y, input);
    judges[judges.length] = new GameChartScoreJudge(3, input.x, input.y);
  }

  for (const note of notes) {
    const { time, score, type, holdEndTime, realPosX, realPosY, judgeline, sprite } = note;
    if (score.isScored && score.isScoreAnimated) continue;

    const timeBetween = time - currentTime,
      timeBetweenReal = timeBetween > 0 ? timeBetween : -timeBetween;

    // Handle hold animation
    if (type === 3 && currentTime >= holdEndTime!) {
      if (score.score !== EGameChartScoreJudgeType.MISS) this.updateScore(score.score);
      sprite!.visible = false;
      score.isScoreAnimated = true;
      continue;
    }

    if (!score.isScored && timeBetween <= 0) {
      if (type !== 3) sprite!.alpha = 1 + (timeBetween / judgeRange.bad); // Handle missing animation

      // Handle miss
      if (timeBetween <= -judgeRange.bad) {
        score.isScored = true;
        score.score = EGameChartScoreJudgeType.MISS;
        score.timeBetween = NaN;

        this.updateScore(score.score);

        if (type !== 3) {
          sprite!.visible = false;
          score.isScoreAnimated = true;
        } else sprite!.alpha = 0.5;
        continue;
      }
    } else if (timeBetween > judgeRange.bad) break;

    if (isAutoPlay) {
      if (type === 1) {
        if (timeBetween <= 0) judges[judges.length] = new GameChartScoreJudge(1, realPosX, realPosY);
      } else if (type === 2) {
        if (timeBetween <= 0) judges[judges.length] = new GameChartScoreJudge(3, realPosX, realPosY);
      } else if (type === 3) {
        if (score.isHolding) judges[judges.length] = new GameChartScoreJudge(3, realPosX, realPosY);
        else if (timeBetween <= 0) judges[judges.length] = new GameChartScoreJudge(1, realPosX, realPosY);
      } else if (type === 4) {
        if (timeBetween <= 0) judges[judges.length] = new GameChartScoreJudge(2, realPosX, realPosY);
      }
    }

    if (type === 1) { // Handle Tap
      for (let i = 0; i < judges.length; i++) {
        const { type, x, y, input } = judges[i];

        if (type !== 1) continue;
        if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, size.noteWidth)) continue;

        score.isScored = true;
        score.timeBetween = timeBetween;

        if (timeBetweenReal <= judgeRange.perfect) score.score = EGameChartScoreJudgeType.PERFECT;
        else if (timeBetweenReal <= judgeRange.good) score.score = EGameChartScoreJudgeType.GOOD;
        else EGameChartScoreJudgeType.BAD;

        if (score.score !== EGameChartScoreJudgeType.BAD) {
          sprite!.visible = false;
          score.isScoreAnimated = true;
        }

        this.updateScore(score.score);
        if (input) input.isTapped = true;
        judges.splice(i, 1);
        break;
      }
    } else if (type === 2) { // Handle Drag
      if (score.isScored && score.score !== EGameChartScoreJudgeType.MISS && timeBetween <= 0) {
        // Calculate score & play effects later
        sprite!.visible = false;
        score.isScoreAnimated = true;
        this.updateScore(score.score);
      } else for (let i = 0; i < judges.length; i++) {
        const { type, x, y } = judges[i];

        if (type !== 3) continue;
        if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, size.noteWidth)) continue;

        score.score = EGameChartScoreJudgeType.PERFECT;
        score.isScored = true;
        score.timeBetween = NaN;

        break;
      }
    } else if (type === 3) { // Handle Hold
      // Skip if hold is missed
      if (score.score === EGameChartScoreJudgeType.MISS) continue;

      if (score.isScored) {
        if (score.isHolding) {
          score.isHolding = false;

          for (let i = 0; i < judges.length; i++) {
            const { type, x, y } = judges[i];

            if (type !== 3) continue;
            if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, size.noteWidth)) continue;

            score.isHolding = true;
            break;
          }
        }
      } else for (let i = 0; i < judges.length; i++) {
        const { type, x, y, input } = judges[i];

        if (type !== 1) continue;
        if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, size.noteWidth)) continue;

        score.score = EGameChartScoreJudgeType.PERFECT;
        score.isScored = true;
        score.timeBetween = timeBetween;
        score.isHolding = true;

        if (input) input.isTapped = true;
        judges.splice(i, 1);
        break;
      }

      if (score.isScored && !score.isHolding) {
        score.score = EGameChartScoreJudgeType.MISS;
        score.timeBetween = NaN;
        score.isHolding = false;

        sprite!.alpha = 0.5;
        this.updateScore(score.score);
      }
    } else if (type === 4) { // Handle Flick
      if (score.isScored && score.score !== EGameChartScoreJudgeType.MISS && timeBetween <= 0) {
        // Calculate score & play effects later
        sprite!.visible = false;
        score.isScoreAnimated = true;
        this.updateScore(score.score);
      } else for (let i = 0; i < judges.length; i++) {
        const { type, x, y, input } = judges[i];

        if (type !== 2) continue;
        if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, size.noteWidth)) continue;

        score.score = EGameChartScoreJudgeType.PERFECT;
        score.isScored = true;
        score.timeBetween = NaN;

        if (input) input.isFlicked = true;
        judges.splice(i, 1);
        break;
      }
    }
  }
}
