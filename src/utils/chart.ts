import { GameChartJudgeLine } from '@/chart/judgeline';
import { GameChartEvent, GameChartEventSingle } from '@/chart/event';
import { parseDoublePrecist } from './math';
import { IGameChartEvent, IGameChartEventSingle } from '@/chart/event';
import { GameChartEventLayer, IGameChartEventLayer } from '@/chart/eventlayer';
import { Nullable } from './types';

export const SortFn = (a: IGameChartEvent, b: IGameChartEvent) => a.startTime - b.startTime;

export const sortEvents = (events: IGameChartEventLayer) => {
  events.speed.sort((a, b) => a.startTime - b.startTime);
  events.moveX.sort(SortFn);
  events.moveY.sort(SortFn);
  events.rotate.sort(SortFn);
  events.alpha.sort(SortFn);
  return events;
};

export const arrangeSameValueEvent = (_events: IGameChartEvent[]) => {
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
    } else {
      result.push(event);
    }
  }

  return result;
};

export const arrangeSameSingleValueEvent = (_events: IGameChartEventSingle[]) => {
  if (_events.length <= 0) return [];
  if (_events.length === 1) return _events;

  const events = [ ..._events ];
  const result = [ events.shift()! ];

  for (const event of events) {
    const lastResult = result[result.length - 1];
    if (lastResult.value !== event.value) {
      result.push(event);
    } else {
      lastResult.endTime = event.endTime;
    }
  }

  return result;
};

export const arrangeSameVariationEvent = (events: IGameChartEvent[]) => {
  if (events.length <= 0) return [];
  if (events.length === 1) return events;

  const oldEvents = [ ...events ];
  const newEvents: IGameChartEvent[] = [ oldEvents.shift()! ];

  for (const oldEvent of oldEvents) {
    const lastNewEvent = newEvents[newEvents.length - 1];

    if (oldEvent.endTime < oldEvent.startTime) {
      const newStartTime = oldEvent.endTime;
      const newEndTime = oldEvent.startTime;

      oldEvent.startTime = newStartTime;
      oldEvent.endTime = newEndTime;
    }

    if (lastNewEvent.endTime < oldEvent.startTime) {
      newEvents.push({
        startTime: lastNewEvent.endTime,
        endTime: oldEvent.startTime,
        start: lastNewEvent.end,
        end: lastNewEvent.end
      }, oldEvent);
    } else if (lastNewEvent.endTime == oldEvent.startTime) {
      newEvents.push(oldEvent);
    } else if (lastNewEvent.endTime > oldEvent.startTime) {
      if (lastNewEvent.endTime < oldEvent.endTime) {
        newEvents.push({
          startTime: lastNewEvent.endTime,
          endTime: oldEvent.endTime,
          start: oldEvent.start + (oldEvent.end - oldEvent.start) * ((lastNewEvent.endTime - oldEvent.startTime) / (oldEvent.endTime - oldEvent.startTime)) + (lastNewEvent.end - oldEvent.start),
          end: oldEvent.end
        });
      }
    }
  }

  const result: IGameChartEvent[] = [ newEvents.shift()! ];
  for (const newEvent of newEvents) {
    const lastResult = result[result.length - 1];
    const timeBetween = lastResult.endTime - lastResult.startTime;
    const timeBetweenNext = newEvent.endTime - newEvent.startTime;

    if (newEvent.startTime == newEvent.endTime) {}
    else if (
      lastResult.end == newEvent.start &&
      (lastResult.end - lastResult.start) * timeBetweenNext == (newEvent.end - newEvent.start) * timeBetween
    ) {
      result[result.length - 1].endTime = newEvent.endTime;
      result[result.length - 1].end     = newEvent.end;
    } else {
      result.push(newEvent);
    }
  }

  return result;
};

export const fillSingleEventTimeline = (_events: IGameChartEventSingle[]) => {
  if (_events.length <= 0) return [];
  if (_events.length === 1) {
    _events[0].endTime = Infinity;
    return _events;
  }

  const events = [ ..._events ];
  const result = [ events.shift()! ];

  for (const event of events) {
    const lastResult = result[result.length - 1];
    if (lastResult.endTime !== event.startTime) lastResult.endTime = event.startTime;
    result.push(event);
  }

  return result;
};

export const arrangeEvents = (events: IGameChartEventLayer) => {
  events.speed = arrangeSameSingleValueEvent(events.speed);
  events.moveX = arrangeSameValueEvent(events.moveX);
  events.moveY = arrangeSameValueEvent(events.moveY);
  events.rotate = arrangeSameValueEvent(events.rotate);
  events.alpha = arrangeSameValueEvent(events.alpha);

  events.speed = fillSingleEventTimeline(events.speed);
  events.moveX = arrangeSameVariationEvent(events.moveX);
  events.moveY = arrangeSameVariationEvent(events.moveY);
  events.rotate = arrangeSameVariationEvent(events.rotate);
  events.alpha = arrangeSameVariationEvent(events.alpha);

  return events;
};

export const parseFirstLayerEvents = (events: IGameChartEventLayer) => {
  const parseFirstLayerEvent = <T extends (IGameChartEvent | IGameChartEventSingle)>(events: T[]) => {
    const startEvent = events[0] as IGameChartEvent;
    const endEvent = events[events.length - 1] as IGameChartEvent;

    if (!isNaN(startEvent.start)) {
      if (startEvent.start === startEvent.end) events[0].startTime = -Infinity;
      else (events as IGameChartEvent[]).unshift({
        startTime: -Infinity,
        endTime: startEvent.startTime,
        start: startEvent.start,
        end: startEvent.start
      });
      if (endEvent.start === endEvent.end) events[events.length - 1].endTime = Infinity;
      else (events as IGameChartEvent[]).push({
        startTime: endEvent.endTime,
        endTime: Infinity,
        start: endEvent.end,
        end: endEvent.end
      });
    } else {
      events[0].startTime = -Infinity;
      events[events.length - 1].endTime = Infinity;
    }

    return events;
  };

  events.speed = parseFirstLayerEvent<IGameChartEventSingle>(events.speed);
  events.moveX = parseFirstLayerEvent<IGameChartEvent>(events.moveX);
  events.moveY = parseFirstLayerEvent<IGameChartEvent>(events.moveY);
  events.rotate = parseFirstLayerEvent<IGameChartEvent>(events.rotate);
  events.alpha = parseFirstLayerEvent<IGameChartEvent>(events.alpha);

  return events;
};

export const convertEventsToClasses = (events: IGameChartEventLayer) => {
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
};

export const calcLineFloorPosition = (judgeline: GameChartJudgeLine) => {
  if (judgeline.floorPositions.length > 0) throw new Error('Floor positions already calculated');
  if (judgeline.eventLayers.length <= 0) throw new Error('No event layers in this line');

  const sameTimeSpeedEvents: Record<number, boolean> = {};
  const floorPositions: IGameChartEventSingle[] = [];
  let currentFloorPosition = -10;

  for (const eventLayer of judgeline.eventLayers) {
    for (const event of eventLayer.speed) {
      const startTime = event.startTime === -Infinity ? -10000 : event.startTime;

      if (!sameTimeSpeedEvents[startTime]) {
        floorPositions.push({
          startTime: startTime,
          endTime: NaN,
          value: event.startTime === -Infinity ? -10 : NaN,
        });
      }
      sameTimeSpeedEvents[startTime] = true;
    }
  }

  floorPositions.sort((a, b) => a.startTime - b.startTime);
  if (floorPositions[0].startTime >= 0) {
    floorPositions.unshift({
      startTime: -10000,
      endTime: floorPositions[0] ? floorPositions[0].startTime : Infinity,
      value: -10
    });
  }

  for (let i = 0; i < floorPositions.length; i++) {
    const event = floorPositions[i];
    const eventNext = floorPositions[i + 1];

    event.value = currentFloorPosition;
    event.endTime = eventNext ? eventNext.startTime : Infinity;

    if (eventNext) currentFloorPosition = parseDoublePrecist(currentFloorPosition + ((eventNext.startTime - event.startTime) / 1000) * getLineSpeedValueByTime(judgeline, event.startTime), 3, -1);
  }

  floorPositions.forEach((event) => judgeline.floorPositions.push(new GameChartEventSingle(
    event.startTime,
    event.endTime,
    event.value
  )));
};

export const getLineSpeedValueByTime = (judgeline: GameChartJudgeLine, time: number) => {
  let result: Nullable<number> = null;

  for (const eventLayer of judgeline.eventLayers) {
    let value: Nullable<number> = null;

    for (const event of eventLayer.speed) {
      if (event.endTime <= time) continue;
      if (event.startTime > time) break;
      value = event.value;
    }

    if (value !== null) {
      if (result === null) result = 0;
      result += value;
    }
  }

  if (result === null) return 1;
  else return result;
};

export const getFloorPositionByTime = (judgeline: GameChartJudgeLine, time: number) => {
  const getFloorPosition = (judgeline: GameChartJudgeLine, time: number) => {
    if (judgeline.floorPositions.length <= 0) throw new Error('No floor positions for this line');

    for (const event of judgeline.floorPositions) {
      if (event.endTime <= time) continue;
      if (event.startTime > time) break;

      return event;
    }

    return new GameChartEventSingle(
      time,
      Infinity,
      time / 1000,
      4
    );
  };

  const speed = getLineSpeedValueByTime(judgeline, time);
  const floorPosition = getFloorPosition(judgeline, time);

  return parseDoublePrecist(floorPosition.value + (speed * ((time - floorPosition.startTime) / 1000)), 3, 1);
};
