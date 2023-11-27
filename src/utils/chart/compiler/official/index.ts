import { PhiChart, PhiChartEvent, PhiChartEventLayer, PhiChartJudgeLine, PhiChartNote } from "../../../../chart/index.ts";
import * as Types from './types';

export function OfficialChartCompiler(json: Types.ChartFormatOfficial) {
  const rawChart = { ...json };
  const notes: Array<PhiChartNote> = [];
  const judgelines: Array<PhiChartJudgeLine> = [];
  const noteCompiler = (note: Types.ChartFormatNoteOfficial, judgeline: PhiChartJudgeLine, isAbove: boolean = true) => {
    return new PhiChartNote({
      /* id, */
      type: note.type,
      time: note.time,
      speed: note.speed,
      judgeline: judgeline,
      isAbove,
      holdTime: note.holdTime
    });
  };

  rawChart.judgeLineList.forEach((rawJudgeline) => {
    const judgeline = new PhiChartJudgeLine({
      // id: judgelineIndex
    });
    const judgelineEvents = {
      moveX: new Array<PhiChartEvent>(),
      moveY: new Array<PhiChartEvent>(),
      alpha: new Array<PhiChartEvent>(),
      rotate: new Array<PhiChartEvent>(),
      speed: new Array<PhiChartEvent>(),
    };

    // Compiling notes
    rawJudgeline.notesAbove.forEach((rawNote) => {
      const note = noteCompiler(rawNote, judgeline, true);
      judgeline.notes.push(note);
      notes.push(note);
    });
    rawJudgeline.notesBelow.forEach((rawNote) => {
      const note = noteCompiler(rawNote, judgeline, false);
      judgeline.notes.push(note);
      notes.push(note);
    });

    // Compiling events
    rawJudgeline.judgeLineMoveEvents.forEach((rawEvent) => {
      judgelineEvents.moveX.push(new PhiChartEvent({
        startTime: rawEvent.startTime,
        endTime: rawEvent.endTime,
        start: rawEvent.start,
        end: rawEvent.end
      }));
      judgelineEvents.moveY.push(new PhiChartEvent({
        startTime: rawEvent.startTime,
        endTime: rawEvent.endTime,
        start: rawEvent.start2,
        end: rawEvent.end2
      }));
    });
    rawJudgeline.judgeLineDisappearEvents.forEach((rawEvent) => {
      judgelineEvents.alpha.push(new PhiChartEvent({
        startTime: rawEvent.startTime,
        endTime: rawEvent.endTime,
        start: rawEvent.start,
        end: rawEvent.end
      }));
    });
    rawJudgeline.judgeLineRotateEvents.forEach((rawEvent) => {
      judgelineEvents.rotate.push(new PhiChartEvent({
        startTime: rawEvent.startTime,
        endTime: rawEvent.endTime,
        start: rawEvent.start,
        end: rawEvent.end
      }));
    });
    rawJudgeline.speedEvents.forEach((rawEvent) => {
      judgelineEvents.speed.push(new PhiChartEvent({
        startTime: rawEvent.startTime,
        endTime: rawEvent.endTime,
        start: rawEvent.value,
        end: rawEvent.value
      }));
    });

    judgeline.eventLayers.push(new PhiChartEventLayer({
      moveXEvents: judgelineEvents.moveX,
      moveYEvents: judgelineEvents.moveY,
      alphaEvents: judgelineEvents.alpha,
      rotateEvents: judgelineEvents.rotate,
      speedEvents: judgelineEvents.speed,
    }));

    judgelines.push(judgeline);
  });

  return new PhiChart({
    offset: rawChart.offset,
    judgelines,
    notes
  });
}