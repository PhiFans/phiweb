import { IPhiChart, IPhiChartEventLayer, IPhiChartJudgeLine, IPhiChartNote } from '../../../../game/chart';
import * as Types from './types';

export function OfficialChartCompiler(json: Types.ChartFormatOfficial) : IPhiChart {
  const rawChart = { ...json };
  const notes: Array<IPhiChartNote> = [];
  const judgelines: Array<IPhiChartJudgeLine> = [];
  const noteCompiler = (note: Types.ChartFormatNoteOfficial, bpm: number, isAbove: boolean = true) : IPhiChartNote => {
    return {
      /* id, */
      type: note.type,
      time: calculateRealTime(note.time, bpm),
      speed: note.speed,
      isAbove,
      holdTime: calculateRealTime(note.holdTime, bpm)
    };
  };

  rawChart.judgeLineList.forEach((rawJudgeline) => {
    const judgeline: IPhiChartJudgeLine = {
      notes: [],
      eventLayers: [],
    };
    const judgelineEvents: IPhiChartEventLayer = {
      moveXEvents: [],
      moveYEvents: [],
      alphaEvents: [],
      rotateEvents: [],
      speedEvents: [],
    };

    // Compiling notes
    rawJudgeline.notesAbove.forEach((rawNote) => {
      const note = noteCompiler(rawNote, rawJudgeline.bpm, true);
      judgeline.notes.push(note);
      notes.push(note);
    });
    rawJudgeline.notesBelow.forEach((rawNote) => {
      const note = noteCompiler(rawNote, rawJudgeline.bpm, false);
      judgeline.notes.push(note);
      notes.push(note);
    });

    // Compiling events
    rawJudgeline.judgeLineMoveEvents.forEach((rawEvent) => {
      judgelineEvents.moveXEvents.push({
        startTime: calculateRealTime(rawEvent.startTime, rawJudgeline.bpm),
        endTime: calculateRealTime(rawEvent.endTime, rawJudgeline.bpm),
        start: rawEvent.start,
        end: rawEvent.end
      });
      judgelineEvents.moveYEvents.push({
        startTime: calculateRealTime(rawEvent.startTime, rawJudgeline.bpm),
        endTime: calculateRealTime(rawEvent.endTime, rawJudgeline.bpm),
        start: rawEvent.start2,
        end: rawEvent.end2
      });
    });
    rawJudgeline.judgeLineDisappearEvents.forEach((rawEvent) => {
      judgelineEvents.alphaEvents.push({
        startTime: calculateRealTime(rawEvent.startTime, rawJudgeline.bpm),
        endTime: calculateRealTime(rawEvent.endTime, rawJudgeline.bpm),
        start: rawEvent.start,
        end: rawEvent.end
      });
    });
    rawJudgeline.judgeLineRotateEvents.forEach((rawEvent) => {
      judgelineEvents.rotateEvents.push({
        startTime: calculateRealTime(rawEvent.startTime, rawJudgeline.bpm),
        endTime: calculateRealTime(rawEvent.endTime, rawJudgeline.bpm),
        start: rawEvent.start,
        end: rawEvent.end
      });
    });
    rawJudgeline.speedEvents.forEach((rawEvent) => {
      judgelineEvents.speedEvents.push({
        startTime: calculateRealTime(rawEvent.startTime, rawJudgeline.bpm),
        endTime: calculateRealTime(rawEvent.endTime, rawJudgeline.bpm),
        start: rawEvent.value,
        end: rawEvent.value
      });
    });

    judgeline.eventLayers.push(judgelineEvents);
    judgelines.push(judgeline);
  });

  return {
    offset: rawChart.offset,
    judgelines,
    notes
  };
}

function calculateRealTime(beat: number, bpm: number) {
  return beat / bpm * 1.875;
}