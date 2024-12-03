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
  if (!isAutoPlay) {
    for (const input of inputList) {
      if (!input.isTapped) judges[judges.length] = new GameChartScoreJudge(1, input.x, input.y);
      if (input.isFlickable && !input.isFlicked) judges[judges.length] = new GameChartScoreJudge(2, input.x, input.y, input);
      judges[judges.length] = new GameChartScoreJudge(3, input.x, input.y);
    }
  }

  for (const note of notes) {
    const { time, score, type, realPosX, realPosY, judgeline, sprite } = note;
    if (score.isScored) continue;

    const timeBetween = time - currentTime,
      timeBetweenReal = timeBetween > 0 ? timeBetween : -timeBetween;
    if (timeBetween < -judgeRange.bad) {
      score.isScored = true;
      score.score = EGameChartScoreJudgeType.MISS;
      continue;
    }
    if (timeBetween > judgeRange.bad) break;

    if (isAutoPlay) {
      if (type === 1) {
        if (timeBetween <= judgeRange.perfect) judges[judges.length] = new GameChartScoreJudge(1, realPosX, realPosY);
      } else if (type === 2) {
        if (timeBetween <= judgeRange.perfect) judges[judges.length] = new GameChartScoreJudge(3, realPosX, realPosY);
      } else if (type === 3) {
        if (score.isHolding) judges[judges.length] = new GameChartScoreJudge(3, realPosX, realPosY);
        else if (timeBetween <= judgeRange.perfect) judges[judges.length] = new GameChartScoreJudge(1, realPosX, realPosY);
      } else if (type === 4) {
        if (timeBetween <= judgeRange.perfect) judges[judges.length] = new GameChartScoreJudge(2, realPosX, realPosY);
      }
    }

    if (type === 1) {
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

        judges.splice(i, 1);
        break;
      }
    }
  }
}
