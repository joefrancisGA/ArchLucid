import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computePilotDayNumber } from "./executive-pilot-day";

describe("computePilotDayNumber", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns day count from first commit UTC", () => {
    const days = computePilotDayNumber("2026-05-02T00:00:00.000Z");

    expect(days).toBe(30);
  });

  it("returns null when first commit is missing", () => {
    expect(computePilotDayNumber(null)).toBeNull();
    expect(computePilotDayNumber(undefined)).toBeNull();
    expect(computePilotDayNumber("")).toBeNull();
  });
});
