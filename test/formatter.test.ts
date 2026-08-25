import { describe, expect, it } from "vitest";
import { formatEventsMarkdown } from "../src/formatter";
import type { GcalEvent } from "../src/types";

describe("formatEventsMarkdown", () => {
  it("formats timed and all-day events", () => {
    const events: GcalEvent[] = [
      {
        id: "1",
        title: "Team Sync",
        start: "2026-08-25T00:00:00.000Z",
        end: "2026-08-25T01:00:00.000Z",
        allDay: false,
        calendarId: "primary",
      },
      {
        id: "2",
        title: "Travel",
        start: "2026-08-26",
        end: "2026-08-27",
        allDay: true,
        calendarId: "primary",
      },
    ];

    expect(formatEventsMarkdown(events, "Asia/Tokyo", "- {{date}} {{time}} {{title}}")).toBe(
      ["- 2026-08-25 09:00-10:00 Team Sync", "- 2026-08-26 All day Travel"].join("\n"),
    );
  });

  it("returns an empty string for no events", () => {
    expect(formatEventsMarkdown([], "Asia/Tokyo", "- {{title}}")).toBe("");
  });
});
