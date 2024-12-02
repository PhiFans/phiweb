
export enum EGameChartScoreType {
  PERFECT = 3,
  GOOD = 2,
  BAD = 1,
  MISS = 0,
  UNSCORED = -1,
}

export interface IGameChartScoreNote {
  /**
   * Wether the score has been calculated.
   */
  isScored: boolean,
  /**
   * Wether the animation has been played.
   */
  isScoreAnimated: boolean,
  /**
   * The score of the note.
   */
  score: EGameChartScoreType,
  /**
   * Time between the hit time and note time, only useful for tap/hold.
   */
  timeBetween: number,
  /**
   * Wether the hold has been holding.
   */
  isHolding: boolean,
  /**
   * Bad animation started time.
   * @default NaN
   */
  animationTime: number,
}
