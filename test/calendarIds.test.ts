import { describe, expect, it } from "vitest";
import { normalizeCalendarIds } from "../src/calendarIds";

describe("normalizeCalendarIds", () => {
  it("uses explicit calendar IDs first", () => {
    expect(normalizeCalendarIds([" primary ", "work@example.com"], ["fallback"])).toEqual([
      "primary",
      "work@example.com",
    ]);
  });

  it("deduplicates calendar IDs", () => {
    expect(normalizeCalendarIds(["primary", "primary", " work "], [])).toEqual(["primary", "work"]);
  });

  it("falls back to configured default calendar IDs", () => {
    expect(normalizeCalendarIds(undefined, ["primary", "family@example.com"])).toEqual([
      "primary",
      "family@example.com",
    ]);
  });

  it("falls back to primary when no calendar IDs are configured", () => {
    expect(normalizeCalendarIds([], [])).toEqual(["primary"]);
  });
});
