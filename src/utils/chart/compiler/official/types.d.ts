

export interface ChartFormatOfficial {
  formatVersion: number;
  offset: number;
  numOfNotes: number;

  judgeLineList: Array<ChartFormatJudgeLineOfficial>;
}

export interface ChartFormatJudgeLineOfficial {
  numOfNotes: number;
  numOfNotesAbove: number;
  numOfNotesBelow: number;
  bpm: number;
  
  notesAbove: Array<ChartFormatNoteOfficial>;
  notesBelow: Array<ChartFormatNoteOfficial>;

  speedEvents: Array<ChartFormatEventSpeedOfficial>;
  judgeLineDisappearEvents: Array<ChartFormatEventOfficial>;
  judgeLineMoveEvents: Array<ChartFormatEventOfficial>;
  judgeLineRotateEvents: Array<ChartFormatEventOfficial>;
}

export interface ChartFormatEventOfficial {
  startTime: number;
  endTime: number;
  start: number;
  end: number;
  start2: number;
  end2: number;
}

export interface ChartFormatEventSpeedOfficial {
  startTime: number;
  endTime: number;
  floorPosition: number;
  value: number;
}

export interface ChartFormatNoteOfficial {
  type: 1 | 2 | 3 | 4;
  time: number;
  positionX: number;
  holdTime: number;
  speed: number;
  floorPosition: number;
}