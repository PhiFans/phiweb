import { IPhiChartEvent, IPhiChartEventLayer } from "../../../game/chart";

export function eventOptimizer(eventLayer: IPhiChartEventLayer): IPhiChartEventLayer {
  return {
    moveXEvents: eventsCombiner(eventsSmoother(eventLayer.moveXEvents)),
    moveYEvents: eventsCombiner(eventsSmoother(eventLayer.moveYEvents)),
    alphaEvents: eventsCombiner(eventsSmoother(eventLayer.alphaEvents)),
    rotateEvents: eventsCombiner(eventsSmoother(eventLayer.rotateEvents)),
    speedEvents: eventsCombiner(eventsSmoother(eventLayer.speedEvents)),
  }
}

export function eventsSmoother(_events: Array<IPhiChartEvent>) {
  const events = [ ..._events ].sort((a, b) => a.startTime - b.startTime);
  let result: Array<IPhiChartEvent> = [];

  if (events.length <= 0) return result;

  for (let i = 0; i < events.length; i++) {
    const lastNewEvent = result[result.length - 1];
    const newEvent: IPhiChartEvent = { ...events[i] };

    if (!lastNewEvent) {
      result.push(newEvent);
      continue;
    }

    if (lastNewEvent.endTime < newEvent.startTime) {
      result.push({
        startTime: lastNewEvent.endTime,
        endTime: newEvent.startTime,
        start: lastNewEvent.end,
        end: lastNewEvent.end,
      }, newEvent);
    } else if (lastNewEvent.endTime == newEvent.startTime) {
      result.push(newEvent);
    } else if (lastNewEvent.endTime > newEvent.startTime) {
      if (lastNewEvent.endTime < newEvent.endTime) {
        result.push({
          startTime: lastNewEvent.endTime,
          endTime: newEvent.endTime,
          start: newEvent.start + (
            (newEvent.end - newEvent.start) * (
              (lastNewEvent.endTime - lastNewEvent.startTime) / (newEvent.endTime - newEvent.startTime)
            ) + (lastNewEvent.end - newEvent.start)
          ),
          end: newEvent.end,
        });
      }
    }
  }

  return result;
}

export function eventsCombiner(_events: Array<IPhiChartEvent>) {
  const events = [ ..._events ].sort((a, b) => a.startTime - b.startTime);
  const result = [ events[0] ];

  if (events.length <= 0) return [];

  for (const newEvent of events) {
    const lastNewEvent = result[result.length - 1];
    const eventTimeDiff = lastNewEvent.endTime - lastNewEvent.startTime;
    const newEventTimeDiff = newEvent.endTime - newEvent.startTime;

    if (newEvent.startTime == newEvent.endTime) {}
    else if (
      lastNewEvent.end == newEvent.start &&
      (lastNewEvent.end - lastNewEvent.start) * eventTimeDiff == (newEvent.end - newEvent.start) * newEventTimeDiff
    ) {
      lastNewEvent.endTime = newEvent.endTime;
      lastNewEvent.end = newEvent.end;
    } else {
      result.push(newEvent);
    }
  }

  return result;
}