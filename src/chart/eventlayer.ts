import { GameChartEvent, GameChartEventSingle } from './event';
import { IGameChartEvent, IGameChartEventSingle } from './event';

export interface IGameChartEventLayer {
  speed: IGameChartEventSingle[],
  moveX: IGameChartEvent[],
  moveY: IGameChartEvent[],
  rotate: IGameChartEvent[],
  alpha: IGameChartEvent[],
}

export class GameChartEventLayer {
  readonly speed: GameChartEventSingle[] = new Array();
  /**
   * Use percentage. The center of the X-axis is `0%`.
   */
  readonly moveX: GameChartEvent[] = new Array();
  /**
   * Use percentage. The center of the Y-axis is `0%`.
   *
   * Note: The Y-axis coordination are reversed. For example, the top of the stage should be `-100%` rather than `100%`.
   */
  readonly moveY: GameChartEvent[] = new Array();
  /**
   * Use radians.
   */
  readonly rotate: GameChartEvent[] = new Array();
  /**
   * Use percentage.
   */
  readonly alpha: GameChartEvent[] = new Array();
}