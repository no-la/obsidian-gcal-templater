import { describe, expect, it } from "vitest";
import { getDisplayParts, toGoogleBoundary } from "../src/dateRange";

describe("dateRange", () => {
  it("converts date-only input in the configured timezone", () => {
    expect(toGoogleBoundary("2026-08-25", "Asia/Tokyo")).toBe("2026-08-24T15:00:00.000Z");
  });

  it("keeps ISO datetime input as UTC ISO", () => {
    expect(toGoogleBoundary("2026-08-25T09:00:00+09:00", "Asia/Tokyo")).toBe(
      "2026-08-25T00:00:00.000Z",
    );
  });

  it("formats display parts in the configured timezone", () => {
    expect(getDisplayParts("2026-08-25T00:00:00.000Z", "Asia/Tokyo")).toEqual({
      date: "2026-08-25",
      time: "09:00",
    });
  });
});
