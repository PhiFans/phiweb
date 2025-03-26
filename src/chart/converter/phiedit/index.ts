import { parseDoublePrecist } from '@/utils/math';
import { GameChartData } from '@/chart/data';
import { GameChartJudgeLine } from '@/chart/judgeline';
import {
  sortEvents as sortLineEvents,
  arrangeEvents,
  parseFirstLayerEvents,
  calcLineFloorPosition,
  convertEventsToClasses,
  getFloorPositionByTime
} from '@/utils/chart';
import { EGameChartNoteType, GameChartNote, IGameChartNote } from '@/chart/note';
import { IGameChartEvent } from '@/chart/event';
import { IGameChartEventLayer } from '@/chart/eventlayer';
import {
  TPhiEditBPM,
  TPhiEditNote,
  IPhiEditCommandBase,
  TPhiEditLine,
  TPhiEditLineEvent,
  TPhiEditLineEventSingle,
  TPhiEditNoteHold
} from './types';

type TPhiEditLineEventSimple = { startBeat: number, endBeat: number };

const Easings: ((pos: number) => number)[] = [
  pos => pos,
	pos => Math.sin(pos * Math.PI / 2),
	pos => 1 - Math.cos(pos * Math.PI / 2),
	pos => 1 - (pos - 1) ** 2,
	pos => pos ** 2,
	pos => (1 - Math.cos(pos * Math.PI)) / 2,
	pos => ((pos *= 2) < 1 ? pos ** 2 : -((pos - 2) ** 2 - 2)) / 2,
	pos => 1 + (pos - 1) ** 3,
	pos => pos ** 3,
	pos => 1 - (pos - 1) ** 4,
	pos => pos ** 4,
	pos => ((pos *= 2) < 1 ? pos ** 3 : ((pos - 2) ** 3 + 2)) / 2,
	pos => ((pos *= 2) < 1 ? pos ** 4 : -((pos - 2) ** 4 - 2)) / 2,
	pos => 1 + (pos - 1) ** 5,
	pos => pos ** 5,
	pos => 1 - 2 ** (-10 * pos),
	pos => 2 ** (10 * (pos - 1)),
	pos => Math.sqrt(1 - (pos - 1) ** 2),
	pos => 1 - Math.sqrt(1 - pos ** 2),
	pos => (2.70158 * pos - 1) * (pos - 1) ** 2 + 1,
	pos => (2.70158 * pos - 1.70158) * pos ** 2,
	pos => ((pos *= 2) < 1 ? (1 - Math.sqrt(1 - pos ** 2)) : (Math.sqrt(1 - (pos - 2) ** 2) + 1)) / 2,
	pos => pos < 0.5 ? (14.379638 * pos - 5.189819) * pos ** 2 : (14.379638 * pos - 9.189819) * (pos - 1) ** 2 + 1,
	pos => 1 - 2 ** (-10 * pos) * Math.cos(pos * Math.PI / .15),
	pos => 2 ** (10 * (pos - 1)) * Math.cos((pos - 1) * Math.PI / .15),
	pos => ((pos *= 11) < 4 ? pos ** 2 : pos < 8 ? (pos - 6) ** 2 + 12 : pos < 10 ? (pos - 9) ** 2 + 15 : (pos - 10.5) ** 2 + 15.75) / 16,
	pos => 1 - Easings[25](1 - pos),
	pos => (pos *= 2) < 1 ? Easings[25](pos) / 2 : Easings[26](pos - 1) / 2 + .5,
	pos => pos < 0.5 ? 2 ** (20 * pos - 11) * Math.sin((160 * pos + 1) * Math.PI / 18) : 1 - 2 ** (9 - 20 * pos) * Math.sin((160 * pos + 1) * Math.PI / 18)
];

const parseNumber = (_number: string | number, defaultValue = 1, precision = 6) => {
  const number = typeof _number === 'string' ? parseFloat(_number) : _number;
  if (isNaN(number)) return defaultValue;
  return parseDoublePrecist(number, precision);
}

const createBasicLine = (): TPhiEditLine => ({
  speed: [],
  moveX: [],
  moveY: [],
  angle: [],
  alpha: []
});

const pushEventToLine = (
  lines: Record<string, TPhiEditLine>,
  lineID: string,
  eventType: keyof TPhiEditLine,
  eventData: TPhiEditLineEvent | TPhiEditLineEventSingle
) => {
  if (isNaN(parseInt(lineID)) || parseInt(lineID) < 0) {
    console.warn(`Invalid line ID: ${lineID}, skipping...`);
    return;
  }

  if (!lines[lineID]) lines[lineID] = createBasicLine();
  const line = lines[lineID];

  if (!line[eventType]) {
    console.warn(`No such line event type: ${eventType}, skipping...`);
    return;
  }
  line[eventType].push(eventData as (TPhiEditLineEvent & TPhiEditLineEventSingle));
};

const sortEvents = (a: TPhiEditLineEventSimple, b: TPhiEditLineEventSimple) => a.startBeat - b.startBeat;

const parseBPM = (BPMs: TPhiEditBPM[]) => {
  let currentBeatRealTime = 500;
  let bpmChangedBeat = 0;
  let bpmChangedTime = 0;

  BPMs.sort(sortEvents);
  for (let i = 0; i < BPMs.length; i++) {
    const bpm = BPMs[i];
    const nextBPM = BPMs[i + 1];

    bpm.endBeat = nextBPM ? nextBPM.startBeat : Infinity;

    bpmChangedTime = parseDoublePrecist(bpmChangedTime + currentBeatRealTime * (bpm.startBeat - bpmChangedBeat), 6, -1);
    bpm.startTime = bpmChangedTime;
    bpm.beatTime = parseDoublePrecist(60000 / bpm.value, 6, -1);

    bpmChangedBeat = parseDoublePrecist(bpmChangedBeat + (bpm.startBeat - bpmChangedBeat), 6, -1);
    currentBeatRealTime = bpm.beatTime;
  }

  return BPMs;
};

const calculateRealTime = (BPMs: TPhiEditBPM[], beat: number) => {
  if (!isFinite(beat)) return beat;

  for (const bpm of BPMs) {
    if (bpm.endBeat <= beat) continue;
    if (bpm.startBeat > beat) break;

    return Math.floor(bpm.startTime! + ((beat - bpm.startBeat) * bpm.beatTime!));
  }

  throw new Error(`Cannot found BPM for beat ${beat}`);
};

const parseNullEventTime = (events: TPhiEditLineEventSimple[]) => {
  events.sort(sortEvents);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const nextEvent = events[i + 1];

    if (!isNaN(event.endBeat)) continue;
    if (!nextEvent) {
      event.endBeat = Infinity;
      break;
    }
    event.endBeat = nextEvent.startBeat;
  }

  return events;
};

const parseNullEvent = (events: TPhiEditLineEvent[]) => {
  for (let i = 0; i < events.length; i++) {
    const lastEvent = events[i - 1];
    const event = events[i];

    if (!isNaN(event.start)) continue;
    event.start = lastEvent ? lastEvent.end : 0;
  }

  return events;
};

const parseNullEvents = (line: TPhiEditLine) => {
  parseNullEventTime(line.speed);
  parseNullEventTime(line.moveX);
  parseNullEventTime(line.moveY);
  parseNullEventTime(line.angle);
  parseNullEventTime(line.alpha);

  parseNullEvent(line.moveX);
  parseNullEvent(line.moveY);
  parseNullEvent(line.angle);
  parseNullEvent(line.alpha);

  return line;
};

const calculateEventEase = (Easings: ((pos: number) => number)[], event: TPhiEditLineEvent, precision: number = 6): IGameChartEvent[] => {
  if (
    event.easing === 1 ||
    (!isFinite(event.startBeat) || !isFinite(event.endBeat)) ||
    event.start === event.end
  ) return [{
    startTime: event.startBeat,
    endTime: event.endBeat,
    start: event.start,
    end: event.end,
  }];

  const { startBeat, endBeat } = event;
  const EasingFn = Easings[event.easing - 1];
  const beatBetween = endBeat - startBeat;
  const result: IGameChartEvent[] = [];

  for (let i = 0, timeCount = Math.ceil(beatBetween / 0.125); i < timeCount; i++) {
    const currentBeat = parseDoublePrecist(startBeat + 0.125 * i, 6);
    const nextBeat = i + 1 < timeCount ? parseDoublePrecist(startBeat + 0.125 * (i + 1), 6) : endBeat;

    const timePercentEnd = EasingFn((currentBeat - startBeat) / beatBetween);
    const timePercentEndNext = EasingFn((nextBeat - startBeat) / beatBetween);

    result.push({
      startTime: currentBeat,
      endTime: nextBeat,
      start: parseDoublePrecist(event.start * (1 - timePercentEnd) + event.end * timePercentEnd, precision),
      end: parseDoublePrecist(event.start * (1 - timePercentEndNext) + event.end * timePercentEndNext, precision),
    });
  }

  return result;
};

const calculateEventRealTime = (BPMs: TPhiEditBPM[], events: IGameChartEvent[]): IGameChartEvent[] => {
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

export const ConvertFromPhiEdit = (_chartRaw: string) => {
  const chartRawArr = _chartRaw.split(/[\r\n]+/);
  const chartOffset = parseInt(chartRawArr.shift()!) - 175;
  if (isNaN(chartOffset)) throw new Error('Not a valid PhiEdit chart file');

  const result = new GameChartData(chartOffset);
  const bpmList: TPhiEditBPM[] = [];
  const noteList: TPhiEditNote[] = [];
  const lineList: Record<string, TPhiEditLine> = {};
  const noteListNew: IGameChartNote[] = [];
  const lineListNew: Record<string, GameChartJudgeLine> = {};

  for (const command of chartRawArr) {
    const commandArr = command.split(/\s/) as IPhiEditCommandBase;
    switch (commandArr[0]) {
      // Parse BPMs
      case 'bp': {
        bpmList.push({
          startBeat: parseNumber(commandArr[1], 0),
          endBeat: NaN,
          value: parseNumber(commandArr[2], 120),
        });
        break;
      }
      // Parse notes
      case 'n1':   // Note (Tap)
      case 'n3':   // Note (Flick)
      case 'n4': { // Note (Drag)
        noteList.push({
          type: (
            commandArr[0] === 'n1' ? EGameChartNoteType.TAP :
            commandArr[0] === 'n3' ? EGameChartNoteType.FLICK : EGameChartNoteType.DRAG
          ),
          lineID: parseNumber(commandArr[1], -1),
          startBeat: parseNumber(commandArr[2], 0),
          positionX: parseNumber(parseFloat(commandArr[3]) / 1024, 0, 4),
          speed: 1,
          scaleX: 1,
          isAbove: commandArr[4] == '1',
          isFake: commandArr[5] == '1',
        });
        break;
      }
      case 'n2': { // Note (Hold)
        noteList.push({
          type: EGameChartNoteType.HOLD,
          lineID: parseNumber(commandArr[1], -1),
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: parseNumber(commandArr[3], 0),
          positionX: parseNumber(parseFloat(commandArr[4]) / 1024, 0, 4),
          speed: 1,
          scaleX: 1,
          isAbove: commandArr[5] == '1',
          isFake: commandArr[6] == '1',
        });
        break;
      }
      case '#': { // Note speed
        noteList[noteList.length - 1].speed = parseNumber(commandArr[1], 1);
        break;
      }
      case '&': { // Note scale X
        noteList[noteList.length - 1].scaleX = parseNumber(commandArr[1], 1, 4);
        break;
      }
      // Parse line events
      case 'cv': { // Speed event
        pushEventToLine(lineList, commandArr[1], 'speed', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: NaN,
          value: parseNumber(parseFloat(commandArr[3]) / (1400 / 120), 1),
        });
        break;
      }
      case 'cm': { // Move event
        pushEventToLine(lineList, commandArr[1], 'moveX', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: parseNumber(commandArr[3], 0),
          start: NaN,
          end: parseNumber((parseFloat(commandArr[4]) / 2048 - 0.5) * 2, 0, 4),
          easing: parseNumber(commandArr[6], 1),
        });
        pushEventToLine(lineList, commandArr[1], 'moveY', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: parseNumber(commandArr[3], 0),
          start: NaN,
          end: parseNumber((parseFloat(commandArr[5]) / 1400 - 0.5) * -2, 0, 4),
          easing: parseNumber(commandArr[6], 1),
        });
        break;
      }
      case 'cp': { // Move event (instance)
        pushEventToLine(lineList, commandArr[1], 'moveX', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: NaN,
          start: parseNumber((parseFloat(commandArr[3]) / 2048 - 0.5) * 2, 0, 4),
          end: parseNumber((parseFloat(commandArr[3]) / 2048 - 0.5) * 2, 0, 4),
          easing: 1,
        });
        pushEventToLine(lineList, commandArr[1], 'moveY', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: NaN,
          start: parseNumber((parseFloat(commandArr[4]) / 1400 - 0.5) * -2, 0, 4),
          end: parseNumber((parseFloat(commandArr[4]) / 1400 - 0.5) * -2, 0, 4),
          easing: 1,
        });
        break;
      }
      case 'cr': { // Rotate event
        pushEventToLine(lineList, commandArr[1], 'angle', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: parseNumber(commandArr[3], 0),
          start: NaN,
          end: parseNumber(commandArr[4], 0, 2),
          easing: parseNumber(commandArr[5], 1),
        });
        break;
      }
      case 'cd': { // Rotate event (instance)
        pushEventToLine(lineList, commandArr[1], 'angle', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: NaN,
          start: parseNumber(commandArr[3], 0, 2),
          end: parseNumber(commandArr[3], 0, 2),
          easing: 1,
        });
        break;
      }
      case 'cf': { // Alpha event
        pushEventToLine(lineList, commandArr[1], 'alpha', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: parseNumber(commandArr[3], 0),
          start: NaN,
          end: parseNumber(parseFloat(commandArr[4]) / 255, 0, 4),
          easing: 1,
        });
        break;
      }
      case 'ca': { // Alpha event (instance)
        pushEventToLine(lineList, commandArr[1], 'alpha', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: NaN,
          start: parseNumber(parseFloat(commandArr[3]) / 255, 0, 4),
          end: parseNumber(parseFloat(commandArr[3]) / 255, 0, 4),
          easing: 1,
        });
        break;
      }
      default: {
        if (commandArr[0] != '') console.warn(`No such command: ${commandArr[0]}, skipping...`);
      }
    }
  }
  parseBPM(bpmList);

  for (const lineID in lineList) {
    const newLine = new GameChartJudgeLine();
    const _newEvents: IGameChartEventLayer = {
      speed: [],
      moveX: [],
      moveY: [],
      rotate: [],
      alpha: [],
    };
    const oldLine = lineList[lineID];
    parseNullEvents(oldLine);

    oldLine.speed.forEach((oldEvent) => {
      _newEvents.speed.push({
        startTime: calculateRealTime(bpmList, oldEvent.startBeat),
        endTime: calculateRealTime(bpmList, oldEvent.endBeat),
        value: oldEvent.value
      });
    });

    oldLine.moveX.forEach((oldEvent) => {
      _newEvents.moveX.push(...calculateEventRealTime(bpmList, calculateEventEase(Easings, {
        startBeat: oldEvent.startBeat,
        endBeat:  oldEvent.endBeat,
        start: oldEvent.start,
        end: oldEvent.end,
        easing: oldEvent.easing,
      }, 4)));
    });

    oldLine.moveY.forEach((oldEvent) => {
      _newEvents.moveY.push(...calculateEventRealTime(bpmList, calculateEventEase(Easings, {
        startBeat: oldEvent.startBeat,
        endBeat:  oldEvent.endBeat,
        start: oldEvent.start,
        end: oldEvent.end,
        easing: oldEvent.easing,
      }, 4)));
    });

    oldLine.angle.forEach((oldEvent) => {
      _newEvents.rotate.push(...calculateEventRealTime(bpmList, calculateEventEase(Easings, {
        startBeat: oldEvent.startBeat,
        endBeat:  oldEvent.endBeat,
        start: oldEvent.start,
        end: oldEvent.end,
        easing: oldEvent.easing,
      }, 2)));
    });

    oldLine.alpha.forEach((oldEvent) => {
      _newEvents.alpha.push({
        startTime: calculateRealTime(bpmList, oldEvent.startBeat),
        endTime:  calculateRealTime(bpmList, oldEvent.endBeat),
        start: oldEvent.start,
        end: oldEvent.end,
      });
    });

    sortLineEvents(_newEvents);
    arrangeEvents(_newEvents);
    parseFirstLayerEvents(_newEvents);
    newLine.eventLayers.push(convertEventsToClasses(_newEvents));
    calcLineFloorPosition(newLine);

    result.lines.push(newLine);
    lineListNew[lineID] = newLine;
  }

  noteList.sort((a, b) => a.startBeat - b.startBeat);
  for (const oldNote of noteList) {
    const line = lineListNew[oldNote.lineID];
    if (!line) {
      console.warn(`Line ID: ${oldNote.lineID} not found, skipping...`);
      continue;
    }

    const noteTime = calculateRealTime(bpmList, oldNote.startBeat);
    const holdTimeLength = oldNote.type === 3 ? calculateRealTime(bpmList, (oldNote as TPhiEditNoteHold).endBeat) - noteTime : null;

    noteListNew.push({
      judgeline: line,
      type: oldNote.type,
      time: noteTime,
      speed: oldNote.speed,
      posX: oldNote.positionX,
      floorPosition: 0,
      isAbove: oldNote.isAbove,
      isFake: oldNote.isFake,
      isSameTime: false,
      holdTime: holdTimeLength,
      holdLength: null,
      scaleX: oldNote.scaleX,
    });
  }

  const sameTimeNote: Record<string, number> = {};
  for (const note of noteListNew) sameTimeNote[`${note.time}`] = sameTimeNote[`${note.time}`] ? 2 : 1;
  for (const oldNote of noteListNew) {
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
      oldNote.holdTime,
      holdLength,
      false,
      oldNote.isFake,
      oldNote.scaleX,
    ));
  }

  return result;
};
