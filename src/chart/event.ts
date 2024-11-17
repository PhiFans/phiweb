import { Nullable } from "@/utils";

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

export class GameChartEvent {
  readonly startTime: number;
  readonly endTime: number;
  readonly start: number;
  readonly end: number;

  constructor(
    startTime: number,
    endTime: number,
    start: number,
    end: number,
    precision: Nullable<number> = null
  ) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.start = precision !== null ? Math.round(start * (10 ** precision)) / (10 ** precision) : start;
    this.end = precision !== null ? Math.round(end * (10 ** precision)) / (10 ** precision) : end;
  }
}
