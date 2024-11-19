import { Nullable } from '@/utils/types';
import { GameChartJudgeLine } from './judgeline';

export enum EGameChartNoteType {
  TAP = 1,
  DRAG = 2,
  HOLD = 3,
  FLICK = 4,
}

export class GameChartNote {
  readonly judgeline: GameChartJudgeLine;
  readonly type: EGameChartNoteType;
  readonly isAbove: boolean;
  readonly time: number;
  /**
   * The time length of hold.
   */
  readonly holdTime: Nullable<number>;
  /**
   * The end time of hold.
   */
  readonly holdEndTime: Nullable<number>;
  readonly speed: number;
  readonly posX: number;

  constructor(
    judgeline: GameChartJudgeLine,
    type: EGameChartNoteType,
    isAbove: boolean,
    time: number,
    speed: number,
    posX: number,
    holdTime: Nullable<number>,
  ) {
    this.judgeline = judgeline;
    this.type = type;
    this.isAbove = isAbove;
    this.time = time;
    this.holdTime = holdTime;
    this.speed = speed;
    this.posX = posX;
    this.holdEndTime = this.type === EGameChartNoteType.HOLD ? this.time + this.holdTime! : null;
  }
}
