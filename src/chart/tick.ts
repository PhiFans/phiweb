import { Container } from 'pixi.js';
import { GameChart } from '.';
import { GameChartEvent } from './event';
import { ArrayIndexed } from '@/utils/class';
import { isLineInArea } from '@/utils/math';
import { EGameChartNoteType } from './note';
import { EGameScoreJudgeType } from '@/score/types';

const valueCalculator = (events: ArrayIndexed<GameChartEvent>, currentTime: number, defaultValue = 0) => {
  const { lastIndex, length } = events;

  if (length === 0) return defaultValue;
  else for (let i = lastIndex, l = length; i < l; i++) {
    const event = events[i];
    if (event.endTime < currentTime) {
      if (i + 1 === length) return events[length - 1].end;
      continue;
    }
    if (event.startTime > currentTime) return i !== 0 ? events[i - 1].end : defaultValue;

    events.lastIndex = i;
    if (event.start === event.end) return event.start;

    const timePercentEnd = (currentTime - event.startTime) / (event.endTime - event.startTime);
    return event.start * (1 - timePercentEnd) + event.end * timePercentEnd;
  }

  return defaultValue;
};

export function onChartTick(this: GameChart, currentTime: number, container: Container) {
  const { data, game } = this;

  const { renderer } = game;
  const { widthHalf, heightHalf } = renderer.size;

  for (const line of data.lines) {
    const { eventLayers, parent } = line;
    const sprite = line.sprite!;

    line.speed = 0;
    line.posX = 0;
    line.posY = 0;
    line.angle = 0;
    line.alpha = 0;

    for (const layer of eventLayers) {
      const {
        moveX,
        moveY,
        rotate,
        alpha,
        speed,

        _posX,
        _posY,
        _angle,
        _alpha
      } = layer;

      layer._posX = valueCalculator(moveX, currentTime, _posX);
      layer._posY = valueCalculator(moveY, currentTime, _posY);
      layer._angle = valueCalculator(rotate, currentTime, _angle);
      layer._alpha = valueCalculator(alpha, currentTime, _alpha);

      if (speed.length !== 0) {
        for (let i = speed.lastIndex, l = speed.length; i < l; i++) {
          const event = speed[i];

          if (event.endTime < currentTime) {
            if (i + 1 === speed.length) layer._speed = speed[i].value;
            continue;
          }
          if (event.startTime > currentTime) break;

          speed.lastIndex = i;
          layer._speed = event.value;
        }
      }

      line.speed += layer._speed;
      line.posX += layer._posX;
      line.posY += layer._posY;
      line.angle += layer._angle;
      line.alpha += layer._alpha;
    }

    const { floorPositions } = line;
    for (let i = floorPositions.lastIndex, l = floorPositions.length; i < l; i++) {
      const event = floorPositions[i];

      if (event.endTime < currentTime) continue;
      if (event.startTime > currentTime) break;

      floorPositions.lastIndex = i;
      line.floorPosition = (currentTime - event.startTime) / 1000 * line.speed + event.value;
    }

    line.radian = line.angle * (Math.PI / 180);
    line.cosr = Math.cos(line.radian);
    line.sinr = Math.sin(line.radian);
    line.realPosX = line.posX * widthHalf;
    line.realPosY = line.posY * heightHalf;

    if (parent !== null) {
      const newX = (line.realPosX * parent.cosr + line.realPosY * parent.sinr) + parent.realPosX,
            newY = (line.realPosY * parent.cosr - line.realPosX * parent.sinr) + parent.realPosY;

      line.realPosX = newX;
      line.realPosY = newY;
    }

    sprite.position.x = line.realPosX;
    sprite.position.y = line.realPosY;
    sprite.angle = line.angle;
    sprite.alpha = line.alpha;
  }

  const { size } = renderer;
  const { widthHalfBorder, heightHalfBorder } = size;
  for (const note of data.notes) {
    const {
      score,
      judgeline,
      type,
      time,
      holdEndTime,
      posX: notePosX,
      floorPosition,
      speed,
      isAbove,
      holdLength,
      holdFloorPosition,
      isOfficial,
      isFake,
      visibleTime
    } = note;
    const floorPositionDiff = (floorPosition - judgeline.floorPosition) * (type === 3 && isOfficial ? 1 : speed);
    const sprite = note.sprite!;

    if (
      isFake &&
      (
        (type !== EGameChartNoteType.HOLD && currentTime >= time) ||
        (type === EGameChartNoteType.HOLD && currentTime >= holdEndTime!)
      )
    ) {
      if (sprite.parent) sprite.removeFromParent();
      continue;
    }
    if (score.isScored && (score.isScoreAnimated || score.score === EGameScoreJudgeType.BAD)) continue;
    if (currentTime < visibleTime) {
      if (sprite.parent) sprite.removeFromParent();
      continue;
    }
    // TODO: Made as an option
    if (floorPositionDiff * 0.6 > 2 || (floorPositionDiff < 0 && time > currentTime && judgeline.isCover)) {
      if (sprite.parent) sprite.removeFromParent();
      continue;
    }

    const posX = size.widthPercent * notePosX;
    const posY = floorPositionDiff * size.noteSpeed * (isAbove ? -1 : 1);
    const realXSin = posY * judgeline.sinr * -1;
    const realYCos = posY * judgeline.cosr;

    note.realLinePosX = posX * judgeline.cosr + judgeline.realPosX;
    note.realLinePosY = posX * judgeline.sinr + judgeline.realPosY;

    note.realHoldEndPosX = note.realPosX = note.realLinePosX + realXSin;
    note.realHoldEndPosY = note.realPosY = note.realLinePosY + realYCos;

    if (type === 3) {
      let realHoldLength = holdLength! * size.noteSpeed / size.noteScale;
      if (time <= currentTime) {
        realHoldLength = (
          isOfficial ? (holdEndTime! - currentTime) / 1000 : (holdFloorPosition! - judgeline.floorPosition)
        ) * speed * size.noteSpeed / size.noteScale;

        const [ spriteHead, spriteBody, spriteEnd ] = sprite.children;

        spriteBody.height = realHoldLength;
        spriteEnd.position.y = -realHoldLength;

        note.realPosX -= realXSin;
        note.realPosY -= realYCos;

        if (spriteHead.visible) spriteHead.visible = false;
      }

      const realHoldLengthY = realHoldLength + posY;
      note.realHoldEndPosX = note.realLinePosX + realHoldLengthY * judgeline.sinr * -1;
      note.realHoldEndPosY = note.realLinePosY + realHoldLengthY * judgeline.cosr;
    }

    if (!isLineInArea(
      [ note.realPosX, note.realPosY, note.realHoldEndPosX, note.realHoldEndPosY ],
      [ -widthHalfBorder, -heightHalfBorder, widthHalfBorder, heightHalfBorder ]
    )) {
      if (sprite.parent) sprite.removeFromParent();
      continue;
    }

    sprite.position.set(note.realPosX, note.realPosY);
    sprite.angle = judgeline.angle + (isAbove ? 0 : 180);
    if (!sprite.parent) container.addChild(sprite);
  }
};
