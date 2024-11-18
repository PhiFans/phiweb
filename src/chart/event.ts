import { Nullable } from "@/utils";

export interface IGameChartEvent {
  startTime: number,
  endTime: number,
  start: number,
  end: number,
}

export class GameChartEvent implements IGameChartEvent {
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
