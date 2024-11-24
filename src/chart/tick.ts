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

    for (const layer of eventLayers) {
      layer.posX = valueCalculator(layer.moveX, currentTime, layer.posX);
      layer.posY = valueCalculator(layer.moveX, currentTime, layer.posY);

      line.posX += layer.posX;
      line.posY += layer.posY;
    }

    sprite.position.x = line.posX * widthHalf;
    sprite.position.y = line.posY * heightHalf;
  }
};
