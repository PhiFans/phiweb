import { IPhiChartEvent } from "../../../game/chart";

export function eventsSmoother(_events: Array<IPhiChartEvent>) {
  const events = [ ..._events ].sort((a, b) => a.startTime - b.startTime);
  let result: Array<IPhiChartEvent> = [];

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