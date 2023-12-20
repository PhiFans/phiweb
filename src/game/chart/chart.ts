import { GameChartJudgeLine } from "./judgeline"
import { GameChartNote } from "./note";
import { IPhiChartJudgeLine } from "./judgeline";
import { IPhiChartNote } from "./note";


export interface IPhiChart {
  readonly offset: number;
  readonly judgelines: Array<IPhiChartJudgeLine>;
  readonly notes: Array<IPhiChartNote>;
}

export class GameChart implements IPhiChart {
  readonly offset: number;
  readonly judgelines: Array<GameChartJudgeLine>;
  readonly notes: Array<GameChartNote>;

  constructor({
    offset,
    judgelines,
    notes
  }: GameChart) {
    this.offset = offset;
    this.judgelines = [ ...judgelines ];
    this.notes = [ ...notes ];
  }
}