import { GameChartEvent } from './event';
import { IPhiChartEvent } from './event';

export interface IPhiChartEventLayer {
  moveXEvents: Array<IPhiChartEvent>;
  moveYEvents: Array<IPhiChartEvent>;
  alphaEvents: Array<IPhiChartEvent>;
  rotateEvents: Array<IPhiChartEvent>;
  speedEvents: Array<IPhiChartEvent>;
}

export class GameChartEventLayer implements IPhiChartEventLayer {
  readonly moveXEvents: Array<GameChartEvent>;
  readonly moveYEvents: Array<GameChartEvent>;
  readonly alphaEvents: Array<GameChartEvent>;
  readonly rotateEvents: Array<GameChartEvent>;
  readonly speedEvents: Array<GameChartEvent>;

  positionX: number;
  positionY: number;
  alpha: number;
  angle: number;
  speed: number;

  constructor({
    moveXEvents,
    moveYEvents,
    alphaEvents,
    rotateEvents,
    speedEvents
  }: GameChartEventLayer) {
    this.moveXEvents = [ ...moveXEvents ];
    this.moveYEvents = [ ...moveYEvents ];
    this.alphaEvents = [ ...alphaEvents ];
    this.rotateEvents = [ ...rotateEvents ];
    this.speedEvents = [ ...speedEvents ];

    // Init layer values
    this.positionX = 0;
    this.positionY = 0;
    this.alpha = 0;
    this.angle = 0;
    this.speed = 1;
  }

  sortEvents() {
    this.moveXEvents.sort((a, b) => a.startTime - b.startTime);
    this.moveYEvents.sort((a, b) => a.startTime - b.startTime);
    this.alphaEvents.sort((a, b) => a.startTime - b.startTime);
    this.rotateEvents.sort((a, b) => a.startTime - b.startTime);
    this.speedEvents.sort((a, b) => a.startTime - b.startTime);

    return this;
  }

  calculateValues(time: number): void {
    this.positionX = calculateValue(time, this.moveXEvents, this.positionX);
    this.positionY = calculateValue(time, this.moveYEvents, this.positionY);
    this.alpha = calculateValue(time, this.alphaEvents, this.alpha);
    this.angle = calculateValue(time, this.rotateEvents, this.angle);
    this.speed = calculateValue(time, this.speedEvents, this.speed);
  }
}

function calculateValue(time: number, events: Array<GameChartEvent>, fallbackValue = 0) {
  for (let i = 0, l = events.length; i < l; i++) {
    const event = events[i];
    if (event.endTime < time) continue;
    if (event.startTime > time) break;

    let timeDiff = event.endTime - event.startTime,
      timePercentStart = (event.endTime - time) / timeDiff,
      timePercentEnd = 1 - timePercentStart;
    
    return event.start * timePercentStart + event.end * timePercentEnd;
  }

  return fallbackValue;
}