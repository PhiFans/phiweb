import * as Utils from '../utils';
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
    let judgelineEvents: IPhiChartEventLayer = {
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
        start: (rawEvent.start - 0.5) * 2,
        end: (rawEvent.end - 0.5) * 2
      });
      judgelineEvents.moveYEvents.push({
        startTime: calculateRealTime(rawEvent.startTime, rawJudgeline.bpm),
        endTime: calculateRealTime(rawEvent.endTime, rawJudgeline.bpm),
        start: (rawEvent.start2 - 0.5) * 2,
        end: (rawEvent.end2 - 0.5) * 2
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

    judgelineEvents = Utils.eventOptimizer(judgelineEvents);

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
  // NOTE: I guess the best way to avoid float number issues is 
  // pre-calc values via microsecond and convert them to second before play it
  return Math.round(beat / bpm * 1875);
}