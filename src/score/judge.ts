import { Nullable } from "@/utils/types";
import { GameChartScoreInput } from "./inputs";

/**
 * 1=Tap; 2=Flick; 3=Hold
 */
type TGameScoreJudgeType = 1 | 2 | 3;

export class GameChartScoreJudge {
  readonly type: TGameScoreJudgeType;
  readonly x: number;
  readonly y: number;

  readonly input: Nullable<GameChartScoreInput> = null;

  constructor(type: TGameScoreJudgeType, x: number, y: number, input: Nullable<GameChartScoreInput> = null) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.input = input;
  }
}
