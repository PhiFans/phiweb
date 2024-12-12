import { EGameChartNoteType } from "@/chart/note";

export type TPhiEditNoteBase = {
  type: EGameChartNoteType,
  lineID: number,
  startBeat: number,
  positionX: number,
  speed: number,
  scaleX: number,
  isAbove: boolean,
  isFake: boolean,
  startTime?: number,
};

export type TPhiEditNoteHold = TPhiEditNoteBase & {
  type: EGameChartNoteType.HOLD,
  endBeat: number,
  endTime?: number,
};

export type TPhiEditLine = {
  speed: TPhiEditLineEventSingle[],
  moveX: TPhiEditLineEvent[],
  moveY: TPhiEditLineEvent[],
  angle: TPhiEditLineEvent[],
  alpha: TPhiEditLineEvent[],
};

export type TPhiEditLineEvent = {
  startBeat: number,
  endBeat: number,
  start: number,
  end: number,
  easing: number,
  startTime?: number,
  endTime?: number,
};

export type TPhiEditLineEventSingle = {
  startBeat: number,
  endBeat: number,
  value: number,
  startTime?: number,
  endTime?: number,
}

export type TPhiEditBPM = TPhiEditLineEventSingle & {
  beatTime?: number,
};

export type TPhiEditNote = TPhiEditNoteBase | TPhiEditNoteHold;

export type TPhiEditCommandTypeBPM = 'bp';
export type TPhiEditCommandTypeNote = 'n1' | 'n2' | 'n3' | 'n4';
export type TPhiEditCommandTypeNoteExtra = '#' | '&';
export type TPhiEditCommandTypeLine = 'cv' | 'cm' | 'cp' | 'cr' | 'cd' | 'cf' | 'ca';
export type TPhiEditCommandType = TPhiEditCommandTypeBPM | TPhiEditCommandTypeNote | TPhiEditCommandTypeNoteExtra | TPhiEditCommandTypeLine;

export interface IPhiEditCommandBase extends Array<string> {
  0: TPhiEditCommandType,
};
