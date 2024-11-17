
export interface IChartOfficial {
  formatVersion: number,
  offset: number,
  numOfNotes: number,
  judgeLineList: Array<IChartJudgeLineOfficial>,
}

export interface IChartJudgeLineOfficial {
  numOfNotes: number,
  numOfNotesAbove: number,
  numOfNotesBelow: number,
  bpm: number,
  notesAbove: Array<IChartNoteOfficial>,
  notesBelow: Array<IChartNoteOfficial>,
  speedEvents: Array<IChartEventSpeedOfficial>,
  judgeLineDisappearEvents: Array<IChartEventOfficial>,
  judgeLineMoveEvents: Array<IChartEventOfficial>,
  judgeLineRotateEvents: Array<IChartEventOfficial>,
}

export interface IChartNoteOfficial {
  type: number,
  time: number,
  positionX: number,
  holdTime: number,
  speed: number,
  floorPosition: number,
}

export interface IChartEventOfficial {
  startTime: number,
  endTime: number,
  start: number,
  end: number,
  start2: number,
  end2: number,
}

export interface IChartEventSpeedOfficial {
  startTime: number,
  endTime: number,
  floorPosition: number,
  value: number,
}