import { Nullable } from "@/utils/types";

export interface IGameChartEvent {
  startTime: number,
  endTime: number,
  start: number,
  end: number,
}

export interface IGameChartEventSingle {
  startTime: number,
  endTime: number,
  value: number,
};

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

export class GameChartEventSingle implements IGameChartEventSingle {
  readonly startTime: number;
  readonly endTime: number;
  readonly value: number;

  constructor(
    startTime: number,
    endTime: number,
    value: number,
    precision: Nullable<number> = null
  ) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.value = precision !== null ? Math.round(value * (10 ** precision)) / (10 ** precision) : value;
  }
}
