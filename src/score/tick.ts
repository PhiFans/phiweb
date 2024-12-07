import { GameScore } from '.';
import { GameChartScoreJudge } from './judge';
import { EGameScoreJudgeType } from './types';

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

export function onScoreTick(this: GameScore, currentTime: number) {
  const { notes, inputs, judges, judgeRange, isAutoPlay, size, hitParticles } = this;
  const { list: inputList } = inputs;

  judges.length = 0;
  if (!isAutoPlay) for (const input of inputList) {
    if (!input.isTapped) judges[judges.length] = new GameChartScoreJudge(1, input.x, input.y, input);
    if (input.isFlickable && !input.isFlicked) judges[judges.length] = new GameChartScoreJudge(2, input.x, input.y, input);
    judges[judges.length] = new GameChartScoreJudge(3, input.x, input.y);
  }

  const { noteWidth } = size;
  for (const note of notes) {
    const { time, score, type, holdEndTime, realPosX, realPosY, realLinePosX, realLinePosY, judgeline, sprite } = note;
    if (score.isScored && score.isScoreAnimated) continue;

    const timeBetween = time - currentTime,
      timeBetweenReal = timeBetween > 0 ? timeBetween : -timeBetween;

    // Handle bad animation
    if (score.animationTime !== null) {
      const percent = (currentTime - score.animationTime) / 500;
      sprite!.alpha = 1 - percent;

      if (percent >= 1) {
        sprite!.removeFromParent();
        score.isScoreAnimated = true;
      }
      continue;
    }

    // Handle hold animation
    if (type === 3 && currentTime >= holdEndTime!) {
      if (score.score !== EGameScoreJudgeType.MISS) this.updateScore(score.score);
      sprite!.removeFromParent();
      score.isScoreAnimated = true;
      continue;
    }

    if (!score.isScored && timeBetween <= 0) {
      if (type !== 3) sprite!.alpha = 1 + (timeBetween / judgeRange.bad); // Handle missing animation

      // Handle miss
      if (timeBetween <= -judgeRange.bad) {
        score.isScored = true;
        score.score = EGameScoreJudgeType.MISS;
        score.timeBetween = NaN;

        this.updateScore(score.score);

        if (type !== 3) {
          sprite!.removeFromParent();
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
        if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, noteWidth)) continue;

        score.isScored = true;
        score.timeBetween = timeBetween;

        if (timeBetweenReal <= judgeRange.perfect) score.score = EGameScoreJudgeType.PERFECT;
        else if (timeBetweenReal <= judgeRange.good) score.score = EGameScoreJudgeType.GOOD;
        else score.score = EGameScoreJudgeType.BAD;

        if (score.score !== EGameScoreJudgeType.BAD) {
          sprite!.removeFromParent();
          score.isScoreAnimated = true;

          this.playHitEffects(realLinePosX, realLinePosY, score.score, currentTime, true, type);
        } else {
          sprite!.tint = 0x6C4343;
          score.animationTime = currentTime;
        }

        this.updateScore(score.score);
        if (input) input.isTapped = true;
        judges.splice(i, 1);
        break;
      }
    } else if (type === 2) { // Handle Drag
      if (score.isScored && score.score !== EGameScoreJudgeType.MISS && timeBetween <= 0) {
        // Calculate score & play effects later
        sprite!.removeFromParent();
        score.isScoreAnimated = true;
        this.playHitEffects(realLinePosX, realLinePosY, score.score, currentTime, true, type);
        this.updateScore(score.score);
      } else for (let i = 0; i < judges.length; i++) {
        const { type, x, y } = judges[i];

        if (type !== 3) continue;
        if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, noteWidth)) continue;

        score.score = EGameScoreJudgeType.PERFECT;
        score.isScored = true;
        score.timeBetween = NaN;

        break;
      }
    } else if (type === 3) { // Handle Hold
      // Skip if hold is missed
      if (score.score === EGameScoreJudgeType.MISS) continue;

      if (score.isScored) {
        if (score.isHolding) {
          score.isHolding = false;

          for (let i = 0; i < judges.length; i++) {
            const { type, x, y } = judges[i];

            if (type !== 3) continue;
            if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, noteWidth)) continue;

            score.isHolding = true;
            break;
          }
        }
      } else for (let i = 0; i < judges.length; i++) {
        const { type, x, y, input } = judges[i];

        if (type !== 1) continue;
        if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, noteWidth)) continue;

        if (timeBetweenReal <= judgeRange.perfect) score.score = EGameScoreJudgeType.PERFECT;
        else EGameScoreJudgeType.GOOD;

        this.playHitEffects(realLinePosX, realLinePosY, score.score, currentTime, true, type);

        score.isScored = true;
        score.timeBetween = timeBetween;
        score.isHolding = true;

        if (input) input.isTapped = true;
        judges.splice(i, 1);
        break;
      }

      if (score.isScored && !score.isHolding) {
        score.score = EGameScoreJudgeType.MISS;
        score.timeBetween = NaN;
        score.isHolding = false;

        sprite!.alpha = 0.5;
        this.updateScore(score.score);
      }
    } else if (type === 4) { // Handle Flick
      if (score.isScored && score.score !== EGameScoreJudgeType.MISS && timeBetween <= 0) {
        // Calculate score & play effects later
        sprite!.removeFromParent();
        score.isScoreAnimated = true;
        this.playHitEffects(realLinePosX, realLinePosY, score.score, currentTime, true, type);
        this.updateScore(score.score);
      } else for (let i = 0; i < judges.length; i++) {
        const { type, x, y, input } = judges[i];

        if (type !== 2) continue;
        if (!isInArea(x, y, realPosX, realPosY, judgeline.cosr, judgeline.sinr, noteWidth)) continue;

        score.score = EGameScoreJudgeType.PERFECT;
        score.isScored = true;
        score.timeBetween = NaN;

        if (input) input.isFlicked = true;
        judges.splice(i, 1);
        break;
      }
    }
  }

  const { hitParticleScale } = size;
  for (const particle of hitParticles) {
    const { time, particleLength, sprites, distance, cosr, sinr, x, y } = particle;
    const progress = (currentTime - time) / 500;
    if (progress >= 1) {
      particle.destroy();
      continue;
    }

    const scale = (((0.2078 * progress - 1.6524) * progress + 1.6399) * progress + 0.4988) * hitParticleScale;

    for (let i = 0; i < particleLength; i++) {
      const sprite = sprites[i];
      const _distance = distance[i] * (9 * progress / (8 * progress + 1)) * hitParticleScale;

      sprite.alpha = 1 - progress;
      sprite.scale.set(scale);
      sprite.position.set(_distance * cosr[i] + x, _distance * sinr[i] + y);
    }
  }

  for (let i = 0; i < hitParticles.length; i++) {
    if (hitParticles[i].isDestroyed) {
      hitParticles.splice(i, 1);
      i--;
    }
  }
}
