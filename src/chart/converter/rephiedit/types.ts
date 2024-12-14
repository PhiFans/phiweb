
export type TRPEChartBeat = [
  number,
  number,
  number,
];

export type TRPEChart = {
  META: TRPEChartMeta,
  BPMList: TRPEChartBPM[],
  judgeLineGroup: string[],
  judgeLineList: TRPEChartLine[],
};

export type TRPEChartMeta = {
  RPEVersion: number,
  background: string,
  charter: string,
  composer: string,
  id: string,
  level: string,
  name: string,
  offset: number,
  song: string,
};

export type TRPEChartBPM = {
  bpm: number,
  startTime: TRPEChartBeat,
}

export type TRPEChartLine = {
  Group: number,
  Name: string,
  Texture: string,
  eventLayers: TRPEChartEventLayer[],
  father: number,
  isCover: number,
  bpmfactor: number,
};

export type TRPEChartEventLayer = {
  speedEvents: TRPEChartEventBase[],
  moveXEvents: TRPEChartEvent[],
  moveYEvents: TRPEChartEvent[],
  rotateEvents: TRPEChartEvent[],
  alphaEvents: TRPEChartEvent[],
};

export type TRPEChartEventBase = {
  startTime: TRPEChartBeat,
  endTime: TRPEChartBeat,
  start: number,
  end: number,
  linkgroup: number,
};

export type TRPEChartEvent = TRPEChartEventBase & {
  easingType: number,
  easingLeft: number,
  easingRight: number,
  bezier: number,
  bezierPoints: [ number, number, number, number ],
};

export type TRPEChartNote = {
  type: number,
  startTime: TRPEChartBeat,
  endTime: TRPEChartBeat,
  positionX: number,
  speed: number,
  above: number,
  isFake: number,
  size: number,
  alpha: number,
  visibleTime: number,
  yOffset: number,
};
