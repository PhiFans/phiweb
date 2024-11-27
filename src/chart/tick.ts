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

export function onChartTick(this: GameChart) {return new Promise((res) => {
  const { data, audio, game } = this;
  const { startTime, clock, status } = audio;
  const { time } = clock;

  if (status !== 1) return;
  const currentTime = time - (startTime || time);
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
    const { judgeline, type, time, holdEndTime, posX: notePosX, floorPosition, speed, isAbove } = note;
    const sprite = note.sprite!;

    if (
      (type !== 3 && time <= currentTime) ||
      (type === 3 && holdEndTime! <= currentTime)
    ) {
      sprite.visible = false;
      continue;
    }

    if (judgeline.floorPosition > floorPosition && time > currentTime) {
      sprite.visible = false;
      continue;
    }

    const posX = size.widthPercent * notePosX;
    const posY = (floorPosition - judgeline.floorPosition) * (type === 3 ? 1 : speed) * size.noteSpeed * (isAbove ? -1 : 1);
    const realXSin = posY * judgeline.sinr * -1;
    const realXCos = posX * judgeline.cosr + judgeline.realPosX;
    const realYSin = posX * judgeline.sinr + judgeline.realPosY;
    const realYCos = posY * judgeline.cosr;

    if (type === 3 && time <= currentTime) {
      const [ spriteHead, spriteBody ] = sprite.children;

      // TODO: Support of the non-official hold rendering
      spriteBody.height = ((holdEndTime! - currentTime) / 1000) * speed * size.noteSpeed / size.noteScale;
      sprite.position.set(realXCos, realYSin);

      if (spriteHead.visible) spriteHead.visible = false;
    } else {
    sprite.position.set(
      realXSin + realXCos,
      realYCos + realYSin
    );
    }

    sprite.angle = judgeline.angle + (isAbove ? 0 : 180);
    if (!sprite.visible) sprite.visible = true;
  }

  res(void 0);
});};
