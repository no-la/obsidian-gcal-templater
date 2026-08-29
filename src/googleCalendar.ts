import { requestUrl } from "obsidian";
import { toGoogleBoundary } from "./dateRange";
import { normalizeEvent } from "./eventNormalizer";
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
      throw: false,
    });

    if (response.status < 200 || response.status >= 300) {
      const detail = googleErrorDetail(response.json, response.text);
      console.error("Google Calendar Templater events.list failed", {
        status: response.status,
        detail,
      });
      throw new Error(`Google Calendar events.list failed: ${response.status}${detail ? ` ${detail}` : ""}`);
    }

    const data = response.json as GoogleEventsResponse;
    return (data.items ?? [])
      .filter((event) => (options.includeDeclined ?? false) || !isDeclinedBySelf(event))
      .map((event) => normalizeEvent(event, calendarId))
      .filter((event) => (options.includeAllDay ?? true) || !event.allDay);
  }
}

function isDeclinedBySelf(event: GoogleCalendarEvent): boolean {
  return event.attendees?.some((attendee) => attendee.self && attendee.responseStatus === "declined") ?? false;
}

function googleErrorDetail(json: unknown, text: string): string {
  const message = extractGoogleErrorMessage(json);
  if (message) return message;
  return text?.trim() ?? "";
}

function extractGoogleErrorMessage(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return undefined;
  }

  const error = (value as { error?: unknown }).error;
  if (typeof error === "string") return error;

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}
