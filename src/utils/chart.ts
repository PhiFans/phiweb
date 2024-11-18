import { IGameChartEvent } from '@/chart/event';
import { IGameChartEvents } from '@/chart';

export const SortFn = (a: IGameChartEvent, b: IGameChartEvent) => a.startTime - b.startTime;

export const sortEvents = (events: IGameChartEvents) => {
  events.speed.sort(SortFn);
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

export const arrangeEvents = (events: IGameChartEvents) => {
  events.speed = arrangeSameValueEvent(events.speed);
  events.moveX = arrangeSameValueEvent(events.moveX);
  events.moveY = arrangeSameValueEvent(events.moveY);
  events.rotate = arrangeSameValueEvent(events.rotate);
  events.alpha = arrangeSameValueEvent(events.alpha);

  events.speed = arrangeSameVariationEvent(events.speed);
  events.moveX = arrangeSameVariationEvent(events.moveX);
  events.moveY = arrangeSameVariationEvent(events.moveY);
  events.rotate = arrangeSameVariationEvent(events.rotate);
  events.alpha = arrangeSameVariationEvent(events.alpha);

  return events;
};

export const parseFirstLayerEvents = (events: IGameChartEvents) => {
  const parseFirstLayerEvent = (events: IGameChartEvent[]) => {
    events[0].startTime = -Infinity;
    events[events.length - 1].endTime = Infinity;
    return events;
  };

  events.speed = parseFirstLayerEvent(events.speed);
  events.moveX = parseFirstLayerEvent(events.moveX);
  events.moveY = parseFirstLayerEvent(events.moveY);
  events.rotate = parseFirstLayerEvent(events.rotate);
  events.alpha = parseFirstLayerEvent(events.alpha);

  return events;
};
