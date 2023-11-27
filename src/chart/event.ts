
export interface IPhiChartEvent {
  readonly startTime: number;
  readonly endTime: number;
  readonly start: number;
  readonly end: number;
}

export class PhiChartEvent {
  readonly startTime: number;
  readonly endTime: number;
  readonly start: number;
  readonly end: number;

  constructor({
    startTime,
    endTime,
    start,
    end
  }: IPhiChartEvent) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.start = start;
    this.end = end;
  }
}