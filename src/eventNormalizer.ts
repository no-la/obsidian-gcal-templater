import type { GcalEvent, GoogleCalendarEvent } from "./types";

export function normalizeEvent(event: GoogleCalendarEvent, calendarId: string): GcalEvent {
  const allDay = Boolean(event.start.date);
  return {
    id: event.id,
    title: event.summary || "(No title)",
    start: event.start.dateTime ?? event.start.date ?? "",
    end: event.end.dateTime ?? event.end.date ?? "",
    allDay,
    location: event.location,
    calendarId,
    colorId: event.colorId,
    htmlLink: event.htmlLink,
  };
}
