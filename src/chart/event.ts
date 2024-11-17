
export class GameChartEventSpeed {
  readonly startTime: number;
  readonly endTime: number;
  readonly value: number;
  floorPosition: number = -1;

  constructor(
    startTime: number,
    endTime: number,
    value: number
  ) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.value = value;
  }
}
