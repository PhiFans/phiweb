import { GameChart } from '@/chart';
import { GameChartJudgeLine } from '@/chart/judgeline';
import { IChartNoteOfficial, IChartOfficial } from './types';
import { GameChartEvent } from '@/chart/event';

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
}

const calcRealTime = (time: number, bpm: number) => Math.floor(time / bpm * 1875);

export const ConvertFromOfficial = (_chartRaw: IChartOfficial) => {
  const chartRaw = ConvertOfficialChartVersion(_chartRaw);
  const oldNotes: IChartNoteOfficial[] = [];
  const newChart = new GameChart();

  chartRaw.judgeLineList.forEach((oldLine, oldLineIndex, oldLines) => {
    const newLine = new GameChartJudgeLine();

    oldLine.speedEvents.forEach((oldEvent) => {
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

    newChart.lines.push(newLine);
  });

  return newChart;
};
