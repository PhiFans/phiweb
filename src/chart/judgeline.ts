import { PhiChartNote } from './note';
import { PhiChartEventLayer } from './eventlayer';

export interface IPhiChartJudgeLine {
  // readonly id: number;
  readonly texture?: string;
}

export class PhiChartJudgeLine {
  // readonly id: number;
  readonly texture?: string;

  notes: Array<PhiChartNote>;
  eventLayers: Array<PhiChartEventLayer>;

  constructor({
    /* id, */
    texture
  }: IPhiChartJudgeLine) {
    // this.id = id;
    this.texture = texture;

    this.notes = [];
    this.eventLayers = [];
  }
}
