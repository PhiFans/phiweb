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

export const arrangeSameValueEvents = (events: IGameChartEvents) => {
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
      } else {
        result.push(event);
      }
    }

    return result;
  };

  events.speed = arrangeSameValueEvent(events.speed);
  events.moveX = arrangeSameValueEvent(events.moveX);
  events.moveY = arrangeSameValueEvent(events.moveY);
  events.rotate = arrangeSameValueEvent(events.rotate);
  events.alpha = arrangeSameValueEvent(events.alpha);

  return events;
};

export const arrangeSameVariationEvent = (events: IGameChartEvent[]) => {
  if (events.length <= 0) return [];
  if (events.length === 1) return events;

  const oldEvents = [ ...events ];
  const newEvents: IGameChartEvent[] = [{
    startTime: -Infinity,
    endTime: 0,
    start: oldEvents[0].start,
    end: oldEvents[0].start,
  }];

  oldEvents.push({
    startTime: oldEvents[oldEvents.length - 1].endTime,
    endTime: Infinity,
    start: oldEvents[oldEvents.length - 1].end,
    end: oldEvents[oldEvents.length - 1].end,
  });

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
