import { Container } from 'pixi.js';
import { GameChart } from '.';
import { GameChartEvent } from './event';

const valueCalculator = (events: GameChartEvent[], currentTime: number, defaultValue = 0) => {
  for (const event of events) {
    if (event.endTime <= currentTime) continue;
    if (event.startTime > currentTime) break;
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
    const { eventLayers } = line;
    const sprite = line.sprite!;

    line.speed = 0;
    line.posX = 0;
    line.posY = 0;
    line.angle = 0;
    line.alpha = 0;

    for (const layer of eventLayers) {
      layer._posX = valueCalculator(layer.moveX, currentTime, layer._posX);
      layer._posY = valueCalculator(layer.moveY, currentTime, layer._posY);
      layer._angle = valueCalculator(layer.rotate, currentTime, layer._angle);
      layer._alpha = valueCalculator(layer.alpha, currentTime, layer._alpha);

      for (const event of layer.speed) {
        if (event.endTime <= currentTime) continue;
        if (event.startTime > currentTime) break;

        layer._speed = event.value;
      }

      line.speed += layer._speed;
      line.posX += layer._posX;
      line.posY += layer._posY;
      line.angle += layer._angle;
      line.alpha += layer._alpha;
    }

    for (const event of line.floorPositions) {
      if (event.endTime <= currentTime) continue;
      if (event.startTime > currentTime) break;

      line.floorPosition = (currentTime - event.startTime) / 1000 * line.speed + event.value;
    }

    line.radian = line.angle * (Math.PI / 180);
    line.cosr = Math.cos(line.radian);
    line.sinr = Math.sin(line.radian);

    sprite.position.x = line.realPosX = line.posX * widthHalf;
    sprite.position.y = line.realPosY = line.posY * heightHalf;
    sprite.angle = line.angle;
    sprite.alpha = line.alpha;
  }

  const { size } = renderer;
  for (const note of data.notes) {
    const { score, judgeline, type, time, holdEndTime, posX: notePosX, floorPosition, speed, isAbove } = note;
    const floorPositionDiff = (floorPosition - judgeline.floorPosition) * (type === 3 ? 1 : speed);
    const sprite = note.sprite!;

    if (score.isScored && score.isScoreAnimated) continue;
    if (floorPositionDiff * 0.6 > 2 || (floorPositionDiff < 0 && time > currentTime)) {
      if (sprite.parent) sprite.removeFromParent();
      continue;
    }

    const posX = size.widthPercent * notePosX;
    const posY = floorPositionDiff * size.noteSpeed * (isAbove ? -1 : 1);
    const realXSin = posY * judgeline.sinr * -1;
    const realYCos = posY * judgeline.cosr;

    note.realPosX = note.realLinePosX = posX * judgeline.cosr + judgeline.realPosX;
    note.realPosY = note.realLinePosY = posX * judgeline.sinr + judgeline.realPosY;

    if (type === 3 && time <= currentTime) {
      const [ spriteHead, spriteBody, spriteEnd ] = sprite.children;

      // TODO: Support of the non-official hold rendering
      const holdLength = ((holdEndTime! - currentTime) / 1000) * speed * size.noteSpeed / size.noteScale;
      spriteBody.height = holdLength;
      spriteEnd.position.y = -holdLength;

      if (spriteHead.visible) spriteHead.visible = false;
    } else {
      note.realPosX += realXSin;
      note.realPosY += realYCos;
    }

    sprite.position.set(note.realPosX, note.realPosY);
    sprite.angle = judgeline.angle + (isAbove ? 0 : 180);
    if (!sprite.parent) container.addChild(sprite);
  }
};
