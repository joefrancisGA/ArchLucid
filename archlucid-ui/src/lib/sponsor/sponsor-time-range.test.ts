import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { filterHistoryPointsByRange } from "./sponsor-time-range";

describe("filterHistoryPointsByRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps points inside the rolling window and drops points outside it", () => {
    const points = [
      { snapshotUtc: "2026-04-01T00:00:00.000Z", label: "before-window" },
      { snapshotUtc: "2026-05-15T00:00:00.000Z", label: "in-window" },
      { snapshotUtc: "2026-07-01T00:00:00.000Z", label: "after-window" },
    ];

    const filtered = filterHistoryPointsByRange(points, "30d");

    expect(filtered.map((point) => point.label)).toEqual(["in-window"]);
  });

  it("returns all points for the all-time range", () => {
    const points = [
      { snapshotUtc: "2020-01-01T00:00:00.000Z" },
      { snapshotUtc: "2030-01-01T00:00:00.000Z" },
    ];

    expect(filterHistoryPointsByRange(points, "all")).toEqual(points);
  });
});
