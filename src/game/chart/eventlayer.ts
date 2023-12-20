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
  moveXEvents: Array<GameChartEvent>;
  moveYEvents: Array<GameChartEvent>;
  alphaEvents: Array<GameChartEvent>;
  rotateEvents: Array<GameChartEvent>;
  speedEvents: Array<GameChartEvent>;

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
  }

  sortEvents() {
    this.moveXEvents.sort((a, b) => a.startTime - b.startTime);
    this.moveYEvents.sort((a, b) => a.startTime - b.startTime);
    this.alphaEvents.sort((a, b) => a.startTime - b.startTime);
    this.rotateEvents.sort((a, b) => a.startTime - b.startTime);
    this.speedEvents.sort((a, b) => a.startTime - b.startTime);

    return this;
  }
}