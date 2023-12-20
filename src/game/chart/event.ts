
export interface IPhiChartEvent {
  readonly startTime: number;
  readonly endTime: number;
  readonly start: number;
  readonly end: number;
}

export class GameChartEvent implements IPhiChartEvent {
  readonly startTime: number;
  readonly endTime: number;
  readonly start: number;
  readonly end: number;

  constructor({
    startTime,
    endTime,
    start,
    end
  }: GameChartEvent) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.start = start;
    this.end = end;
  }
}