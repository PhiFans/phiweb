import { GameChart } from '@/chart';

export interface GameEvents {
  /**
   * Emit before chart start.
   */
  'chart.prestart': (chart: GameChart) => void,
  /**
   * Emit after chart start.
   */
  'chart.poststart': (chart: GameChart) => void,
};
