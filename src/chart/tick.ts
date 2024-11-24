import { GameChart } from '.';
import { GameChartEvent } from './event';

const valueCalculator = (events: GameChartEvent[], currentTime: number, defaultValue = 0) => {
  for (const event of events) {
    if (event.endTime < currentTime) continue;
    if (event.startTime > currentTime) break;
    if (event.start === event.end) return event.start;

    const timePercentEnd = (currentTime - event.startTime) / (event.endTime - event.startTime);
    return event.start * (1 - timePercentEnd) + event.end * timePercentEnd;
  }

  return defaultValue;
};

export function onChartTick(this: GameChart) {
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

    line.posX = 0;
    line.posY = 0;
    line.angle = 0;
    line.alpha = 0;

    for (const layer of eventLayers) {
      layer._posX = valueCalculator(layer.moveX, currentTime, layer._posX);
      layer._posY = valueCalculator(layer.moveY, currentTime, layer._posY);
      layer._angle = valueCalculator(layer.rotate, currentTime, layer._angle);
      layer._alpha = valueCalculator(layer.alpha, currentTime, layer._alpha);

      line.posX += layer._posX;
      line.posY += layer._posY;
      line.angle += layer._angle;
      line.alpha += layer._alpha;
    }

    sprite.position.x = line.posX * widthHalf;
    sprite.position.y = line.posY * heightHalf;
    sprite.angle = line.angle;
    sprite.alpha = line.alpha;
  }
};
