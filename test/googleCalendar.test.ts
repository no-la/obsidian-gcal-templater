import { describe, expect, it } from "vitest";
import { normalizeEvent } from "../src/eventNormalizer";

describe("normalizeEvent", () => {
  it("preserves Google Calendar event color IDs", () => {
    expect(
      normalizeEvent(
        {
          id: "event-1",
          summary: "Dentist",
          colorId: "5",
          start: { dateTime: "2026-08-25T09:00:00+09:00" },
          end: { dateTime: "2026-08-25T10:00:00+09:00" },
        },
        "primary",
      ),
    ).toMatchObject({
      id: "event-1",
      title: "Dentist",
      colorId: "5",
      calendarId: "primary",
    });
  });
});
