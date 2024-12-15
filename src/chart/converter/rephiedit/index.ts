import BezierEasing from 'bezier-easing';
import { GameChartData } from '@/chart/data';
import { TRPEChart, TRPEChartBeat, TRPEChartBPM, TRPEChartEvent, TRPEChartEventBase } from './types';
import { IGameChartEventLayer } from '@/chart/eventlayer';
import { parseDoublePrecist } from '@/utils/math';
import { arrangeEvents, calcLineFloorPosition, convertEventsToClasses, getFloorPositionByTime, parseFirstLayerEvents, sortEvents as sortLineEvents } from '@/utils/chart';
import { TChartBPM } from '../types';
import { IGameChartEvent, IGameChartEventSingle } from '@/chart/event';
import { GameChartJudgeLine } from '@/chart/judgeline';
import { EGameChartNoteType, GameChartNote, IGameChartNote } from '@/chart/note';

type TimeExtra = { startBeat: number, endBeat: number };

const Easings: ((x: number) => number)[] = [
  (x) => x,
  (x) => Math.sin((x * Math.PI) / 2),
  (x) => 1 - Math.cos((x * Math.PI) / 2),
  (x) => 1 - (1 - x) * (1 - x),
  (x) => x * x,
  (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
  (x) => 1 - Math.pow(1 - x, 3),
  (x) => x * x * x,
  (x) => 1 - Math.pow(1 - x, 4),
  (x) => x * x * x * x,
  (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  (x) => x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2,
  (x) => 1 - Math.pow(1 - x, 5),
  (x) => x * x * x * x * x,
  (x) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x),
  (x) => x === 0 ? 0 : Math.pow(2, 10 * x - 10),
  (x) => Math.sqrt(1 - Math.pow(x - 1, 2)),
  (x) => 1 - Math.sqrt(1 - Math.pow(x, 2)),
  (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2),
  (x) => 2.70158 * x * x * x - 1.70158 * x * x,
  (x) => x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,
  (x) => x < 0.5 ? (Math.pow(2 * x, 2) * ((2.594910 + 1) * 2 * x - 2.594910)) / 2 : (Math.pow(2 * x - 2, 2) * ((2.594910 + 1) * (x * 2 - 2) + 2.594910) + 2) / 2,
  (x) => x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  (x) => x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * ((2 * Math.PI) / 3)),
  (x) => x < 1 / 2.75 ? 7.5625 * x * x : x < 2 / 2.75 ? 7.5625 * (x -= 1.5 / 2.75) * x + 0.75 : x < 2.5 / 2.75 ? 7.5625 * (x -= 2.25 / 2.75) * x + 0.9375 : 7.5625 * (x -= 2.625 / 2.75) * x + 0.984375,
  (x) => 1 - Easings[25](1 - x),
  (x) => x < 0.5 ? (1 - Easings[25](1 - 2 * x)) / 2 : (1 + Easings[25](2 * x - 1)) / 2
];

const beatToNumber = (beatArray: TRPEChartBeat) => parseDoublePrecist(beatArray[0] + (beatArray[1] / beatArray[2]), 6, -1);
const sortEvents = <T extends { startTime: TRPEChartBeat }>(events: T[]) => {
  return events.sort((a, b) => beatToNumber(a.startTime) - beatToNumber(b.startTime));
}

const parseBPM = (oldBPMs: TRPEChartBPM[]) => {
  const BPMs = sortEvents<TRPEChartBPM>([ ...oldBPMs ]);
  const result: TChartBPM[] = [];

  let currentBeatRealTime = 500;
  let bpmChangedBeat = 0;
  let bpmChangedTime = 0;

  for (let i = 0; i < BPMs.length; i++) {
    const oldBPM = BPMs[i];
    const nextOldBPM = BPMs[i + 1];

    const startBeat = beatToNumber(oldBPM.startTime);
    const endBeat = nextOldBPM ? beatToNumber(nextOldBPM.startTime) : Infinity;

    bpmChangedTime = parseDoublePrecist(bpmChangedTime + currentBeatRealTime * (startBeat - bpmChangedBeat), 6, -1);
    bpmChangedBeat = parseDoublePrecist(bpmChangedBeat + (startBeat - bpmChangedBeat), 6, -1);
    currentBeatRealTime = parseDoublePrecist(60000 / oldBPM.bpm, 6, -1);

    result.push({
      startBeat: startBeat,
      endBeat: endBeat,
      value: oldBPM.bpm,
      startTime: bpmChangedTime,
      beatTime: currentBeatRealTime,
    });
  }

  return result;
};

const calculateRealTime = (BPMs: TChartBPM[], beat: number) => {
  if (!isFinite(beat)) return beat;

  for (const bpm of BPMs) {
    if (bpm.endBeat <= beat) continue;
    if (bpm.startBeat > beat) break;

    return Math.floor(bpm.startTime! + ((beat - bpm.startBeat) * bpm.beatTime!));
  }

  throw new Error(`Cannot found BPM for beat ${beat}`);
};

const calculateEventValue = (Easings: ((pos: number) => number)[], event: TRPEChartEvent & TimeExtra, beat: number, precision: number = 6): number => {
  const { startBeat, endBeat, start, end } = event;
  const BezierFn = event.bezierPoints ? BezierEasing(...event.bezierPoints) : Easings[0];
  const EasingFn = event.bezier === 1 ? BezierFn : Easings[event.easingType - 1];

  const timePercentEnd = (beat - startBeat) / (endBeat - startBeat);
  const easePercent = EasingFn(event.easingLeft * (1 - timePercentEnd) + event.easingRight * timePercentEnd);
  const resultPercentEnd = (easePercent - EasingFn(event.easingLeft)) / (EasingFn(event.easingRight) - EasingFn(event.easingLeft));

  return parseDoublePrecist(start * (1 - resultPercentEnd) + end * resultPercentEnd, precision);
};

const calculateEventEase = (Easings: ((pos: number) => number)[], eventOld: TRPEChartEvent, precision: number = 6): IGameChartEvent[] => {
  const event: TRPEChartEvent & TimeExtra = {
    ...eventOld,
    startBeat: beatToNumber(eventOld.startTime),
    endBeat: beatToNumber(eventOld.endTime),
  };

  if (
    (event.easingType === 1 && event.bezier === 0) ||
    (event.start === event.end)
  ) return [{
    startTime: event.startBeat,
    endTime: event.endBeat,
    start: event.start,
    end: event.end,
  }];

  const { startBeat, endBeat } = event;
  const beatBetween = endBeat - startBeat;
  const result: IGameChartEvent[] = [];

  for (let i = 0, timeCount = Math.ceil(beatBetween / 0.125); i < timeCount; i++) {
    const currentBeat = parseDoublePrecist(startBeat + 0.125 * i, 6);
    const nextBeat = i + 1 < timeCount ? parseDoublePrecist(startBeat + 0.125 * (i + 1), 6) : endBeat;

    result.push({
      startTime: currentBeat,
      endTime: nextBeat,
      start: calculateEventValue(Easings, event, currentBeat, precision),
      end: calculateEventValue(Easings, event, nextBeat, precision),
    });
  }

  return result;
};

const calculateSpeedEventEase = (eventOld: TRPEChartEventBase): IGameChartEventSingle[] => {
  const event: TRPEChartEventBase & TimeExtra = {
    ...eventOld,
    startBeat: beatToNumber(eventOld.startTime),
    endBeat: beatToNumber(eventOld.endTime),
  };

  if (event.start === event.end) return [{
    startTime: event.startBeat,
    endTime: event.endBeat,
    value: event.start,
  }];

  const { startBeat, endBeat } = event;
  const beatBetween = endBeat - startBeat;
  const result: IGameChartEventSingle[] = [];

  for (let i = 0, timeCount = Math.ceil(beatBetween / 0.125); i < timeCount; i++) {
    const currentBeat = parseDoublePrecist(startBeat + 0.125 * i, 6, -1);
    const nextBeat = (i + 1 < timeCount) ? parseDoublePrecist(startBeat + 0.125 * (i + 1), 6, -1) : endBeat;

    result.push({
      startTime: currentBeat,
      endTime: nextBeat,
      value: calculateEventValue(Easings,
        {
          ...event,
          easingType: 1,
          easingLeft: 0,
          easingRight: 1,
          bezier: 0,
          bezierPoints: [0, 0, 1, 1],
        },
        currentBeat, 6
      ),
    });
  }

  result.push({
    startTime: endBeat,
    endTime: parseDoublePrecist(endBeat + 0.125, 6, -1),
    value: event.end,
  });
  return result;
};

const calculateEventRealTime = (BPMs: TChartBPM[], events: IGameChartEvent[]): IGameChartEvent[] => {
  const result: IGameChartEvent[] = [];

  for (const event of events) {
    result.push({
      startTime: calculateRealTime(BPMs, event.startTime),
      endTime: calculateRealTime(BPMs, event.endTime),
      start: event.start, end: event.end
    });
  }

  return result;
};

export const ConvertFromRePhiEdit = (_chartRaw: TRPEChart) => {
  if (!_chartRaw.META.RPEVersion || isNaN(_chartRaw.META.RPEVersion)) throw new Error('Not a valid Re:PhiEdit chart');
  const result = new GameChartData(_chartRaw.META.offset);
  const bpmList: TChartBPM[] = parseBPM(_chartRaw.BPMList);
  const noteList: IGameChartNote[] = [];

  // Parse lines
  _chartRaw.judgeLineList.forEach((oldLine) => {
    // TODO: Line textures, etc.
    const newLine = new GameChartJudgeLine(oldLine.isCover === 1);

    // Parse line events
    oldLine.eventLayers.forEach((oldLayer, layerIndex) => {
      if (!oldLayer) return;

      const newEvents: IGameChartEventLayer = {
        speed: [],
        moveX: [],
        moveY: [],
        rotate: [],
        alpha: [],
      };

      if (oldLayer.speedEvents) oldLayer.speedEvents.forEach((oldEvent) => {
        newEvents.speed.push(...calculateSpeedEventEase({
          ...oldEvent,
          start: parseDoublePrecist(oldEvent.start / 4.5, 6),
          end: parseDoublePrecist(oldEvent.end / 4.5, 6),
        }).map((e) => ({
          ...e,
          startTime: calculateRealTime(bpmList, e.startTime),
          endTime: calculateRealTime(bpmList, e.endTime),
        })));
      });

      if (oldLayer.moveXEvents) oldLayer.moveXEvents.forEach((oldEvent) => {
        newEvents.moveX.push(...calculateEventRealTime(bpmList, calculateEventEase(Easings, {
          ...oldEvent,
          start: oldEvent.start / 675,
          end: oldEvent.end / 675
        }, 4)));
      });

      if (oldLayer.moveYEvents) oldLayer.moveYEvents.forEach((oldEvent) => {
        newEvents.moveY.push(...calculateEventRealTime(bpmList, calculateEventEase(Easings, {
          ...oldEvent,
          start: oldEvent.start / -450,
          end: oldEvent.end / -450
        }, 4)));
      });

      if (oldLayer.rotateEvents) oldLayer.rotateEvents.forEach((oldEvent) => {
        newEvents.rotate.push(...calculateEventRealTime(bpmList, calculateEventEase(Easings, {
          ...oldEvent,
          start: oldEvent.start,
          end: oldEvent.end
        }, 2)));
      });

      if (oldLayer.alphaEvents) oldLayer.alphaEvents.forEach((oldEvent) => {
        newEvents.alpha.push(...calculateEventRealTime(bpmList, calculateEventEase(Easings, {
          ...oldEvent,
          start: oldEvent.start / 255,
          end: oldEvent.end / 255
        }, 4)));
      });

      sortLineEvents(newEvents);
      arrangeEvents(newEvents);
      if (layerIndex === 0) parseFirstLayerEvents(newEvents);
      newLine.eventLayers.push(convertEventsToClasses(newEvents));
    });

    calcLineFloorPosition(newLine);
    result.lines.push(newLine);

    // Parse notes
    if (oldLine.notes) oldLine.notes.forEach((oldNote) => {
      const realTime = calculateRealTime(bpmList, beatToNumber(oldNote.startTime));
      const holdTime = oldNote.type === 2 ? Math.floor(calculateRealTime(bpmList, beatToNumber(oldNote.endTime)) - realTime) : null;

      // TODO: xScale, yOffset, etc.
      noteList.push({
        judgeline: newLine,
        type: (
          oldNote.type === 1 ? EGameChartNoteType.TAP :
          oldNote.type === 2 ? EGameChartNoteType.HOLD :
          oldNote.type === 3 ? EGameChartNoteType.FLICK :
          oldNote.type === 4 ? EGameChartNoteType.DRAG : EGameChartNoteType.TAP
        ),
        time: realTime,
        holdTime: holdTime,
        speed: oldNote.speed,
        posX: parseDoublePrecist(oldNote.positionX / (675 * (9 / 80)), 6),
        isAbove: oldNote.above === 1,
        isFake: oldNote.isFake === 1,
        isSameTime: false,
        floorPosition: 0,
        holdLength: null,
      });
    });
  });

  noteList.sort((a, b) => a.time - b.time);
  const sameTimeNote: Record<string, number> = {};
  for (const note of noteList) sameTimeNote[`${note.time}`] = sameTimeNote[`${note.time}`] ? 2 : 1;
  for (const oldNote of noteList) {
    const floorPosition = getFloorPositionByTime(oldNote.judgeline, oldNote.time);
    const holdLength = oldNote.type === 3 ? parseDoublePrecist(getFloorPositionByTime(oldNote.judgeline, (oldNote.time + oldNote.holdTime!)) - floorPosition, 3, -1) : null;

    result.notes.push(new GameChartNote(
      oldNote.judgeline,
      oldNote.type,
      oldNote.isAbove,
      oldNote.time,
      oldNote.speed,
      oldNote.posX,
      sameTimeNote[`${oldNote.time}`] === 2,
      floorPosition,
      oldNote.isFake,
      oldNote.holdTime,
      holdLength
    ));
  }

  return result;
};
