import { PhiChartJudgeLine } from "./judgeline"
import { PhiChartNote } from "./note";


export interface IPhiChart {
  readonly offset: number;
  readonly judgelines: Array<PhiChartJudgeLine>;
  readonly notes: Array<PhiChartNote>;
}

export class PhiChart {
  readonly offset: number;
  readonly judgelines: Array<PhiChartJudgeLine>;
  readonly notes: Array<PhiChartNote>;

  constructor({
    offset,
    judgelines,
    notes
  }: IPhiChart) {
    this.offset = offset;
    this.judgelines = [ ...judgelines ];
    this.notes = [ ...notes ];
  }
}