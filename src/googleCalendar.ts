import { requestUrl } from "obsidian";
import { toGoogleBoundary } from "./dateRange";
import type {
  GcalEvent,
  GcalEventsOptions,
  GoogleCalendarEvent,
  GoogleEventsResponse,
} from "./types";

export class GoogleCalendarClient {
  constructor(
    private getAccessToken: () => Promise<string>,
    private getDefaultCalendarId: () => string,
    private getTimezone: () => string,
  ) {}

  async getEvents(options: GcalEventsOptions): Promise<GcalEvent[]> {
    const timezone = this.getTimezone();
    const calendarId = options.calendarId || this.getDefaultCalendarId() || "primary";
    const timeMin = toGoogleBoundary(options.from, timezone);
    const timeMax = toGoogleBoundary(options.to, timezone);
    const accessToken = await this.getAccessToken();

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      showDeleted: "false",
      timeZone: timezone,
    });

    const response = await requestUrl({
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Google Calendar events.list failed: ${response.status}`);
    }

    const data = response.json as GoogleEventsResponse;
    return (data.items ?? [])
      .filter((event) => (options.includeDeclined ?? false) || !isDeclinedBySelf(event))
      .map((event) => normalizeEvent(event, calendarId))
      .filter((event) => (options.includeAllDay ?? true) || !event.allDay);
  }
}

function normalizeEvent(event: GoogleCalendarEvent, calendarId: string): GcalEvent {
  const allDay = Boolean(event.start.date);
  return {
    id: event.id,
    title: event.summary || "(No title)",
    start: event.start.dateTime ?? event.start.date ?? "",
    end: event.end.dateTime ?? event.end.date ?? "",
    allDay,
    location: event.location,
    calendarId,
    htmlLink: event.htmlLink,
  };
}

function isDeclinedBySelf(event: GoogleCalendarEvent): boolean {
  return event.attendees?.some((attendee) => attendee.self && attendee.responseStatus === "declined") ?? false;
}
