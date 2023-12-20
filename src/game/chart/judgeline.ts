import { GameChartNote } from './note';
import { GameChartEventLayer } from './eventlayer';
import { GameChartFloorPosition } from './floorposition';

export interface IPhiChartJudgeLine {
  // readonly id: number;
  readonly texture?: string;
}

export class GameChartJudgeLine implements IPhiChartJudgeLine {
  // readonly id: number;
  readonly texture?: string;

  notes: Array<GameChartNote>;
  eventLayers: Array<GameChartEventLayer>;
  floorPositions: Array<GameChartFloorPosition>;

  constructor({
    /* id, */
    texture
  }: GameChartJudgeLine) {
    // this.id = id;
    this.texture = texture;

    this.notes = [];
    this.eventLayers = [];
    this.floorPositions = new Array<GameChartFloorPosition>();
  }
}
