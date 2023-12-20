import { GameChartJudgeLine } from './judgeline';
import { IPhiChartJudgeLine } from './judgeline';

export interface IPhiChartNote {
  // readonly id: number;
  readonly type: 1 | 2 | 3 | 4;
  readonly time: number;
  readonly speed: number;
  readonly judgeline: IPhiChartJudgeLine;
  readonly isAbove: boolean;
  readonly holdTime?: number;
}

export class GameChartNote implements IPhiChartNote {
  // readonly id: number;
  readonly type: 1 | 2 | 3 | 4;
  readonly time: number;
  readonly speed: number;
  readonly judgeline: GameChartJudgeLine;
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
  }: GameChartNote) {
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