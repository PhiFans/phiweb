import { EGameChartNoteType } from "@/chart/note";
import { Nullable } from "@/utils/types";

export type TChartNoteBase = {
  type: EGameChartNoteType,
  lineID: number,
  startBeat: number,
  positionX: number,
  speed: number,
  scaleX: number,
  isAbove: boolean,
  isFake: boolean,
};

export type TChartNoteHold = TChartNoteBase & {
  type: EGameChartNoteType.HOLD,
  endBeat: number,
};

export type TChartNote = TChartNoteBase | TChartNoteHold;

export type TChartLine = {
  eventLayers: TChartEventLayer[],
  notes: TChartNote[],
  isCover: boolean,
  texture: Nullable<string>,
  father: Nullable<number>,
};

export type TChartEventLayer = {
  speed: TChartEventSingle[],
  moveX: TChartEvent[],
  moveY: TChartEvent[],
  angle: TChartEvent[],
  alpha: TChartEvent[],
};

export type TChartEvent = {
  startBeat: number,
  endBeat: number,
  start: number,
  end: number,
  easing: number,
};

export type TChartEventSingle = {
  startBeat: number,
  endBeat: number,
  value: number,
}

export type TChartBPM = TChartEventSingle & {
  startTime?: number,
  beatTime?: number,
};
