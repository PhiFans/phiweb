import { GameChart } from '@/chart';
import { GameChartJudgeLine } from '@/chart/judgeline';
import { IChartNoteOfficial, IChartOfficial } from './types';
import { GameChartEvent, IGameChartEvent } from '@/chart/event';

// TODO: Should be moved later
interface IGameChartEvents {
  speed: IGameChartEvent[],
  moveX: IGameChartEvent[],
  moveY: IGameChartEvent[],
  rotate: IGameChartEvent[],
  alpha: IGameChartEvent[],
}

const parseDoublePrecist = (double: number, precision: number = 0) => Math.round(double * (10 ** precision)) / (10 ** precision);
const calcRealTime = (time: number, bpm: number) => Math.floor(time / bpm * 1875);
const SortFn = (a: IGameChartEvent, b: IGameChartEvent) => a.startTime - b.startTime;

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

// TODO: Should be moved to utils
const sortEvents = (events: IGameChartEvents) => {
  events.speed.sort(SortFn);
  events.moveX.sort(SortFn);
  events.moveY.sort(SortFn);
  events.rotate.sort(SortFn);
  events.alpha.sort(SortFn);
  return events;
};

// TODO: Should be moved to utils
const arrangeSameValueEvents = (events: IGameChartEvents) => {
  const arrangeSameValueEvent = (_events: IGameChartEvent[]) => {
    if (_events.length <= 0) return [];
    if (_events.length === 1) return _events;

    let events = [ ..._events ];
    let result = [ events.shift()! ];

    for (const event of events) {
      if (
        result[result.length - 1].start == result[result.length - 1].end &&
        event.start == event.end &&
        result[result.length - 1].start == event.start
      ) {
        result[result.length - 1].endTime = event.endTime;
      }
      else
      {
        result.push(event);
      }
    }

    return result.slice();
  };

  events.speed = arrangeSameValueEvent(events.speed);
  events.moveX = arrangeSameValueEvent(events.moveX);
  events.moveY = arrangeSameValueEvent(events.moveY);
  events.rotate = arrangeSameValueEvent(events.rotate);
  events.alpha = arrangeSameValueEvent(events.alpha);

  return events;
};

export const ConvertFromOfficial = (_chartRaw: IChartOfficial) => {
  const chartRaw = ConvertOfficialChartVersion(_chartRaw);
  const oldNotes: IChartNoteOfficial[] = [];
  const newChart = new GameChart();

  chartRaw.judgeLineList.forEach((oldLine, oldLineIndex, oldLines) => {
    const newLine = new GameChartJudgeLine();
    const _newEvents: IGameChartEvents = {
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
        start: parseDoublePrecist(oldEvent.value, 6),
        end: parseDoublePrecist(oldEvent.value, 6),
      });

      newLine.speed.push(new GameChartEvent(
        calcRealTime(oldEvent.startTime, oldLine.bpm),
        oldEvent.endTime < 999999999 ? calcRealTime(oldEvent.endTime, oldLine.bpm) : Infinity,
        oldEvent.value, oldEvent.value,
        6 // Should be enough
      ));
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

      newLine.moveX.push(new GameChartEvent(
        startTime, endTime,
        (oldEvent.start - 0.5),
        (oldEvent.end - 0.5) * 2,
        4
      ));

      newLine.moveY.push(new GameChartEvent(
        startTime, endTime,
        (0.5 - oldEvent.start2) * 2,
        (0.5 - oldEvent.end2) * 2,
        4
      ));
    });

    oldLine.judgeLineRotateEvents.forEach((oldEvent) => {
      _newEvents.rotate.push({
        startTime: calcRealTime(oldEvent.startTime, oldLine.bpm),
        endTime: oldEvent.endTime < 999999999 ? calcRealTime(oldEvent.endTime, oldLine.bpm) : Infinity,
        start: -(Math.PI / 180) * oldEvent.start,
        end: -(Math.PI / 180) * oldEvent.end
      });

      newLine.rotate.push(new GameChartEvent(
        calcRealTime(oldEvent.startTime, oldLine.bpm),
        oldEvent.endTime < 999999999 ? calcRealTime(oldEvent.endTime, oldLine.bpm) : Infinity,
        -(Math.PI / 180) * oldEvent.start,
        -(Math.PI / 180) * oldEvent.end
      ));
    });

    oldLine.judgeLineDisappearEvents.forEach((oldEvent) => {
      _newEvents.alpha.push({
        startTime: calcRealTime(oldEvent.startTime, oldLine.bpm),
        endTime: oldEvent.endTime < 999999999 ? calcRealTime(oldEvent.endTime, oldLine.bpm) : Infinity,
        start: parseDoublePrecist(oldEvent.start, 4),
        end: parseDoublePrecist(oldEvent.end, 4),
      });

      newLine.alpha.push(new GameChartEvent(
        calcRealTime(oldEvent.startTime, oldLine.bpm),
        oldEvent.endTime < 999999999 ? calcRealTime(oldEvent.endTime, oldLine.bpm) : Infinity,
        oldEvent.start,
        oldEvent.end,
        4
      ));

      sortEvents(_newEvents);
      arrangeSameValueEvents(_newEvents);
    });

    newChart.lines.push(newLine);
  });

  return newChart;
};
