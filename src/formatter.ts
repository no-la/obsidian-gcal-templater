import { getDisplayParts } from "./dateRange";
import type { GcalEvent } from "./types";

export function formatEventsMarkdown(
  events: GcalEvent[],
  timezone: string,
  format: string,
): string {
  if (events.length === 0) {
    return "";
  }

  return events
    .map((event) => formatEvent(event, timezone, format))
    .join("\n");
}

function formatEvent(event: GcalEvent, timezone: string, format: string): string {
  const date = event.allDay ? event.start : getDisplayParts(event.start, timezone).date;
  const start = event.allDay ? "All day" : getDisplayParts(event.start, timezone).time;
  const end = event.allDay ? "" : getDisplayParts(event.end, timezone).time;
  const time = event.allDay ? "All day" : `${start}-${end}`;
  const location = event.location ?? "";
  const link = event.htmlLink ?? "";

  return format
    .split("{{date}}").join(date)
    .split("{{time}}").join(time)
    .split("{{start}}").join(start)
    .split("{{end}}").join(end)
    .split("{{title}}").join(event.title)
    .split("{{location}}").join(location)
    .split("{{calendarId}}").join(event.calendarId)
    .split("{{htmlLink}}").join(link);
}
