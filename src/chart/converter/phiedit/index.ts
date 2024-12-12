import { parseDoublePrecist } from '@/utils/math';
import { EGameChartNoteType } from '@/chart/note';
import { TPhiEditBPM, TPhiEditNote, IPhiEditCommandBase, TPhiEditLine, TPhiEditLineEvent, TPhiEditLineEventSingle } from './types';

const parseNumber = (_number: string | number, defaultValue = 1, precision = 6) => {
  const number = typeof _number === 'string' ? parseInt(_number) : _number;
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

export const ConvertFromPhiEdit = (_chartRaw: string) => {
  const chartRawArr = _chartRaw.split(/[\r\n]+/);
  const chartOffset = parseInt(chartRawArr.shift()!);
  if (isNaN(chartOffset)) throw new Error('Not a valid PhiEdit chart file');
  const bpmList: TPhiEditBPM[] = [];
  const noteList: TPhiEditNote[] = [];
  const lineList: Record<string, TPhiEditLine> = {};

  for (const command of chartRawArr) {
    const commandArr = command.split(/\s/) as IPhiEditCommandBase;
    switch (commandArr[0]) {
      // Parse BPMs
      case 'bp': {
        bpmList.push({
          startBeat: parseDoublePrecist(parseInt(commandArr[1]), 6),
          bpm: parseDoublePrecist(parseInt(commandArr[2]), 6),
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
          positionX: parseNumber(commandArr[3], 0),
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
          positionX: parseNumber(commandArr[4], 0),
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
        noteList[noteList.length - 1].scaleX = parseNumber(commandArr[1], 1);
        break;
      }
      // Parse line events
      case 'cv': { // Speed event
        pushEventToLine(lineList, commandArr[1], 'speed', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: NaN,
          value: parseNumber(parseInt(commandArr[3]) / 7, 1),
        });
        break;
      }
      case 'cm': { // Move event
        pushEventToLine(lineList, commandArr[1], 'moveX', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: parseNumber(commandArr[3], 0),
          start: NaN,
          end: parseNumber((parseInt(commandArr[4]) / 2048 - 0.5) * 2, 0, 4),
          easing: parseNumber(commandArr[6], 1),
        });
        pushEventToLine(lineList, commandArr[1], 'moveY', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: parseNumber(commandArr[3], 0),
          start: NaN,
          end: parseNumber((parseInt(commandArr[5]) / 1400 - 0.5) * 2, 0, 4),
          easing: parseNumber(commandArr[6], 1),
        });
        break;
      }
      case 'cp': { // Move event (instance)
        pushEventToLine(lineList, commandArr[1], 'moveX', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: NaN,
          start: parseNumber((parseInt(commandArr[3]) / 2048 - 0.5) * 2, 0, 4),
          end: parseNumber((parseInt(commandArr[3]) / 2048 - 0.5) * 2, 0, 4),
          easing: 1,
        });
        pushEventToLine(lineList, commandArr[1], 'moveY', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: NaN,
          start: parseNumber((parseInt(commandArr[4]) / 1400 - 0.5) * 2, 0, 4),
          end: parseNumber((parseInt(commandArr[4]) / 1400 - 0.5) * 2, 0, 4),
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
          end: parseNumber(parseInt(commandArr[4]) / 255, 0, 4),
          easing: 1,
        });
        break;
      }
      case 'ca': { // Alpha event (instance)
        pushEventToLine(lineList, commandArr[1], 'alpha', {
          startBeat: parseNumber(commandArr[2], 0),
          endBeat: NaN,
          start: parseNumber(parseInt(commandArr[3]) / 255, 0, 4),
          end: parseNumber(parseInt(commandArr[3]) / 255, 0, 4),
          easing: 1,
        });
        break;
      }
      default: {
        if (commandArr[0] != '') console.warn(`No such command: ${commandArr[0]}, skipping...`);
      }
    }
  }

  console.log(bpmList);
  console.log(noteList);
  console.log(lineList);
};
