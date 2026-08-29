export function normalizeCalendarIds(calendarIds: string[] | undefined, fallbackCalendarIds: string[]): string[] {
  const explicit = dedupeCalendarIds(calendarIds ?? []);
  if (explicit.length > 0) {
    return explicit;
  }

  const fallback = dedupeCalendarIds(fallbackCalendarIds);
  return fallback.length > 0 ? fallback : ["primary"];
}

export function dedupeCalendarIds(calendarIds: string[]): string[] {
  return [...new Set(calendarIds.map((calendarId) => calendarId.trim()).filter(Boolean))];
}
