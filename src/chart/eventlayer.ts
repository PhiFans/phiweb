import { ArrayIndexed } from '@/utils/class';
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
  /**
   * 1 Speed = 100vh/s
   */
  readonly speed: ArrayIndexed<GameChartEventSingle> = new ArrayIndexed();
  /**
   * Use percentage. The center of the X-axis is `0%`.
   */
  readonly moveX: ArrayIndexed<GameChartEvent> = new ArrayIndexed();
  /**
   * Use percentage. The center of the Y-axis is `0%`.
   *
   * Note: The Y-axis coordination are reversed. For example, the top of the stage should be `-100%` rather than `100%`.
   */
  readonly moveY: ArrayIndexed<GameChartEvent> = new ArrayIndexed();
  /**
   * Use angles.
   */
  readonly rotate: ArrayIndexed<GameChartEvent> = new ArrayIndexed();
  /**
   * Use percentage.
   */
  readonly alpha: ArrayIndexed<GameChartEvent> = new ArrayIndexed();

  _speed: number = 0;
  _posX: number = 0;
  _posY: number = 0;
  _angle: number = 0;
  _alpha: number = 0;

  reset() {
    this.speed.reset();
    this.moveX.reset();
    this.moveY.reset();
    this.rotate.reset();
    this.alpha.reset();

    this._speed = 0;
    this._posX = 0;
    this._posY = 0;
    this._angle = 0;
    this._alpha = 0;
  }
}
