import { GameChartEventSingle } from './event';
import { GameChartEventLayer } from './eventlayer';

export class GameChartJudgeLine {
  readonly eventLayers: Array<GameChartEventLayer> = new Array();
  readonly floorPositions: Array<GameChartEventSingle> = new Array();
}
