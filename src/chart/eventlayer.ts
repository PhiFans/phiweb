import { PhiChartEvent } from "./event"

export interface IPhiChartEventLayer {
  moveXEvents: Array<PhiChartEvent>;
  moveYEvents: Array<PhiChartEvent>;
  alphaEvents: Array<PhiChartEvent>;
  rotateEvents: Array<PhiChartEvent>;
  speedEvents: Array<PhiChartEvent>;
}

export class PhiChartEventLayer {
  moveXEvents: Array<PhiChartEvent>;
  moveYEvents: Array<PhiChartEvent>;
  alphaEvents: Array<PhiChartEvent>;
  rotateEvents: Array<PhiChartEvent>;
  speedEvents: Array<PhiChartEvent>;

  constructor({
    moveXEvents,
    moveYEvents,
    alphaEvents,
    rotateEvents,
    speedEvents
  }: IPhiChartEventLayer) {
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