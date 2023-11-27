import { PhiChartJudgeLine } from './judgeline';

export interface IPhiChartNote {
  // readonly id: number;
  readonly type: 1 | 2 | 3 | 4;
  readonly time: number;
  readonly speed: number;
  readonly judgeline: PhiChartJudgeLine;
  readonly isAbove: boolean;
  readonly holdTime?: number;
}

export class PhiChartNote {
  // readonly id: number;
  readonly type: 1 | 2 | 3 | 4;
  readonly time: number;
  readonly speed: number;
  readonly judgeline: PhiChartJudgeLine;
  readonly isAbove: boolean;

  readonly holdTime: number;
  readonly holdEndTime: number;

  constructor({
    /* id, */
    type,
    time,
    speed,
    judgeline,
    isAbove,
    holdTime
  }: IPhiChartNote) {
    // this.id = id;
    this.type = type;
    this.time = time;
    this.speed = speed;
    this.judgeline = judgeline;
    this.isAbove = isAbove;

    this.holdTime = holdTime || NaN;
    this.holdEndTime = this.time + this.holdTime;
  }
}