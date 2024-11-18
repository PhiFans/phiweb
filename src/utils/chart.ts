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
