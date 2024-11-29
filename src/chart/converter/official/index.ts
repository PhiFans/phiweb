import { GameChartData } from '@/chart/data';
import { GameChartJudgeLine } from '@/chart/judgeline';
import { sortEvents, arrangeEvents, parseFirstLayerEvents, calcLineFloorPosition, getFloorPositionByTime } from '@/utils/chart';
import { parseDoublePrecist } from '@/utils/math';
import { IChartOfficial } from './types';
import { GameChartEvent, GameChartEventSingle } from '@/chart/event';
import { GameChartEventLayer, IGameChartEventLayer } from '@/chart/eventlayer';
import { EGameChartNoteType, GameChartNote, IGameChartNote } from '@/chart/note';

const calcRealTime = (time: number, bpm: number) => Math.floor(time / bpm * 1875);
const getNoteType = (type: number) => {
  switch (type) {
    case 1: return EGameChartNoteType.TAP;
    case 2: return EGameChartNoteType.DRAG;
    case 3: return EGameChartNoteType.HOLD;
    case 4: return EGameChartNoteType.FLICK;
    default: {
      throw new Error(`No such note type: ${type}`);
    }
  }
};

const ConvertOfficialChartVersion = (chart: IChartOfficial) => {
  const result: IChartOfficial = { ...chart };
  switch (result.formatVersion) {
    case 1: {
      result.formatVersion = 3;
      for (const line of result.judgeLineList) {
        let floorPosition = 0;

        for (const speedEvent of line.speedEvents) {
          if (speedEvent.startTime < 0) speedEvent.startTime = 0;
          speedEvent.floorPosition = floorPosition;
          floorPosition += (speedEvent.endTime - speedEvent.startTime) * speedEvent.value / line.bpm * 1.875;
        }

        for (const alphaEvent of line.judgeLineDisappearEvents) {
          alphaEvent.start2 = 0;
          alphaEvent.end2 = 0;
        }

        for (const moveEvent of line.judgeLineMoveEvents) {
          moveEvent.start2 = moveEvent.start % 1e3 / 520;
          moveEvent.end2 = moveEvent.end % 1e3 / 520;
          moveEvent.start = moveEvent.start / 1e3 / 880;
          moveEvent.end = moveEvent.end / 1e3 / 880;
        }

        for (const rotateEvent of line.judgeLineRotateEvents) {
          rotateEvent.start2 = 0;
          rotateEvent.end2 = 0;
        }
      }
      break;
    }
    case 3: {
      break;
    }
    default: {
      throw new Error(`Unsupported official chart format version: ${result.formatVersion}`);
    }
  }
  return result;
};

const convertEventsToClasses = (events: IGameChartEventLayer) => {
  const result = new GameChartEventLayer();

  events.speed.forEach((e) => result.speed.push(new GameChartEventSingle(
    e.startTime,
    e.endTime,
    e.value
  )));

  events.moveX.forEach((e) => result.moveX.push(new GameChartEvent(
    e.startTime,
    e.endTime,
    e.start,
    e.end
  )));

  events.moveY.forEach((e) => result.moveY.push(new GameChartEvent(
    e.startTime,
    e.endTime,
    e.start,
    e.end
  )));

  events.rotate.forEach((e) => result.rotate.push(new GameChartEvent(
    e.startTime,
    e.endTime,
    e.start,
    e.end
  )));

  events.alpha.forEach((e) => result.alpha.push(new GameChartEvent(
    e.startTime,
    e.endTime,
    e.start,
    e.end
  )));

  return result;
}

export const ConvertFromOfficial = (_chartRaw: IChartOfficial) => {
  const chartRaw = ConvertOfficialChartVersion(_chartRaw);
  const newChart = new GameChartData(chartRaw.offset * 1000);
  const _newNotes: IGameChartNote[] = [];

  chartRaw.judgeLineList.forEach((oldLine) => {
    const newLine = new GameChartJudgeLine();
    const _newEvents: IGameChartEventLayer = {
      speed: [],
      moveX: [],
      moveY: [],
      rotate: [],
      alpha: [],
    };

    oldLine.speedEvents.forEach((oldEvent) => {
      _newEvents.speed.push({
        startTime: calcRealTime(oldEvent.startTime, oldLine.bpm),
        endTime: oldEvent.endTime < 999999999 ? calcRealTime(oldEvent.endTime, oldLine.bpm) : Infinity,
        value: parseDoublePrecist(oldEvent.value, 6),
      });
    });

    oldLine.judgeLineMoveEvents.forEach((oldEvent) => {
      const startTime = calcRealTime(oldEvent.startTime, oldLine.bpm);
      const endTime = oldEvent.endTime < 999999999 ? calcRealTime(oldEvent.endTime, oldLine.bpm) : Infinity;

      _newEvents.moveX.push({
        startTime,
        endTime,
        start: parseDoublePrecist((oldEvent.start - 0.5) * 2, 4),
        end: parseDoublePrecist((oldEvent.end - 0.5) * 2, 4),
      });

      _newEvents.moveY.push({
        startTime,
        endTime,
        start: parseDoublePrecist((0.5 - oldEvent.start2) * 2, 4),
        end: parseDoublePrecist((0.5 - oldEvent.end2) * 2, 4),
      });
    });

    oldLine.judgeLineRotateEvents.forEach((oldEvent) => {
      _newEvents.rotate.push({
        startTime: calcRealTime(oldEvent.startTime, oldLine.bpm),
        endTime: oldEvent.endTime < 999999999 ? calcRealTime(oldEvent.endTime, oldLine.bpm) : Infinity,
        start: -parseDoublePrecist(oldEvent.start, 4),
        end: -parseDoublePrecist(oldEvent.end, 4)
      });
    });

    oldLine.judgeLineDisappearEvents.forEach((oldEvent) => {
      _newEvents.alpha.push({
        startTime: calcRealTime(oldEvent.startTime, oldLine.bpm),
        endTime: oldEvent.endTime < 999999999 ? calcRealTime(oldEvent.endTime, oldLine.bpm) : Infinity,
        start: parseDoublePrecist(oldEvent.start, 4),
        end: parseDoublePrecist(oldEvent.end, 4),
      });
    });

    sortEvents(_newEvents);
    arrangeEvents(_newEvents);
    parseFirstLayerEvents(_newEvents);
    newLine.eventLayers.push(convertEventsToClasses(_newEvents));
    calcLineFloorPosition(newLine);

    // Parsing notes
    oldLine.notesAbove.forEach((oldNote) => {
      const parsedSpeed = parseDoublePrecist(oldNote.speed, 6);
      const realTime = calcRealTime(oldNote.time, oldLine.bpm);
      const realHoldTime = oldNote.type === 3 ? calcRealTime(oldNote.holdTime, oldLine.bpm) : null;

      _newNotes.push({
        judgeline: newLine,
        type: getNoteType(oldNote.type),
        isAbove: true,
        time: realTime,
        speed: parsedSpeed,
        posX: oldNote.positionX,
        isSameTime: false,
        floorPosition: getFloorPositionByTime(newLine, realTime),
        holdTime: realHoldTime,
        holdLength: oldNote.type === 3 ? parseDoublePrecist(realHoldTime! * parsedSpeed / 1000, 4) : null
      });
    });

    oldLine.notesBelow.forEach((oldNote) => {
      const parsedSpeed = parseDoublePrecist(oldNote.speed, 6);
      const realTime = calcRealTime(oldNote.time, oldLine.bpm);
      const realHoldTime = oldNote.type === 3 ? calcRealTime(oldNote.holdTime, oldLine.bpm) : null;

      _newNotes.push({
        judgeline: newLine,
        type: getNoteType(oldNote.type),
        isAbove: false,
        time: realTime,
        speed: parsedSpeed,
        posX: oldNote.positionX,
        isSameTime: false,
        floorPosition: getFloorPositionByTime(newLine, realTime),
        holdTime: realHoldTime,
        holdLength: oldNote.type === 3 ? parseDoublePrecist(realHoldTime! * parsedSpeed / 1000, 4) : null
      });
    });

    newChart.lines.push(newLine);
  });

  const sameTimeNote: Record<string, number> = {};
  _newNotes.sort((a, b) => a.time - b.time);
  for (const note of _newNotes) sameTimeNote[`${note.time}`] = sameTimeNote[`${note.time}`] ? 2 : 1;
  for (const note of _newNotes) note.isSameTime = sameTimeNote[`${note.time}`] === 2;

  _newNotes.forEach((oldNote) => {
    newChart.notes.push(new GameChartNote(
      oldNote.judgeline,
      oldNote.type,
      oldNote.isAbove,
      oldNote.time,
      oldNote.speed,
      parseDoublePrecist(oldNote.posX, 6),
      oldNote.isSameTime,
      oldNote.floorPosition,
      oldNote.holdTime,
      oldNote.holdLength
    ));
  });
  newChart.notes.sort((a, b) => a.time - b.time);

  return newChart;
};
