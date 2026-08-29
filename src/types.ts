export type OutputFormat = "markdown" | "raw";

export type GcalEventsOptions = {
  from: string;
  to: string;
  calendarId?: string;
  format?: OutputFormat;
  includeAllDay?: boolean;
  includeDeclined?: boolean;
};

export type GcalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  calendarId: string;
  colorId?: string;
  htmlLink?: string;
};

export type PluginSettings = {
  clientId: string;
  clientSecret: string;
  defaultCalendarId: string;
  timezone: string;
  markdownFormat: string;
  tokenFallback?: StoredTokenSet;
};

export type StoredTokenSet = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

export type GoogleCalendarEventDate = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

export type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  start: GoogleCalendarEventDate;
  end: GoogleCalendarEventDate;
  location?: string;
  colorId?: string;
  htmlLink?: string;
  status?: string;
  attendees?: Array<{ self?: boolean; responseStatus?: string }>;
};

export type GoogleEventsResponse = {
  items?: GoogleCalendarEvent[];
};

declare global {
  interface Window {
    gcalEvents?: (options: GcalEventsOptions) => Promise<string | GcalEvent[]>;
  }
}
