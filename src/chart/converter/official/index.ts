import { GameChart } from '@/chart';
import { GameChartJudgeLine } from '@/chart/judgeline';
import { sortEvents, arrangeEvents } from '@/utils/chart';
import { IChartNoteOfficial, IChartOfficial } from './types';
import { GameChartEvent } from '@/chart/event';
import { IGameChartEvents } from '@/chart';

const parseDoublePrecist = (double: number, precision: number = 0) => Math.round(double * (10 ** precision)) / (10 ** precision);
const calcRealTime = (time: number, bpm: number) => Math.floor(time / bpm * 1875);

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

const convertEventsToClasses = (events: IGameChartEvents) => {
  const result = new GameChartJudgeLine();

  events.speed.forEach((e) => result.speed.push(new GameChartEvent(
    e.startTime,
    e.endTime,
    e.start,
    e.end
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
  const oldNotes: IChartNoteOfficial[] = [];
  const newChart = new GameChart();

  chartRaw.judgeLineList.forEach((oldLine, oldLineIndex, oldLines) => {
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
        start: -(Math.PI / 180) * oldEvent.start,
        end: -(Math.PI / 180) * oldEvent.end
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
    newChart.lines.push(convertEventsToClasses(_newEvents));
  });

  return newChart;
};
