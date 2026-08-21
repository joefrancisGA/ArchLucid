import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildAdvisoryScheduleExamplePreviewView,
  resolveExampleWeeklyMondayInstants,
} from "@/lib/advisory-schedule-page-model";

describe("resolveExampleWeeklyMondayInstants", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns next Monday after and previous Monday before a mid-week reference instant", () => {
    vi.setSystemTime(new Date("2026-08-20T15:30:00.000Z"));

    const { nextUtc, lastUtc } = resolveExampleWeeklyMondayInstants();

    expect(new Date(nextUtc).getTime()).toBeGreaterThan(Date.now());
    expect(new Date(lastUtc).getTime()).toBeLessThan(Date.now());
    expect(new Date(nextUtc).getUTCDay()).toBe(1);
    expect(new Date(lastUtc).getUTCDay()).toBe(1);
    expect(new Date(nextUtc).getUTCHours()).toBe(8);
    expect(new Date(lastUtc).getUTCHours()).toBe(8);
  });

  it("steps to adjacent weeks when reference falls exactly on Monday 08:00 UTC", () => {
    vi.setSystemTime(new Date("2026-08-24T08:00:00.000Z"));

    const { nextUtc, lastUtc } = resolveExampleWeeklyMondayInstants();

    expect(nextUtc).toBe("2026-08-31T08:00:00.000Z");
    expect(lastUtc).toBe("2026-08-17T08:00:00.000Z");
  });
});

describe("buildAdvisoryScheduleExamplePreviewView", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T15:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses Ready status vocabulary and relative Monday instants", () => {
    const view = buildAdvisoryScheduleExamplePreviewView("claims-intake", "UTC");

    expect(view.statusLabel).toBe("Ready");
    expect(view.statusKind).toBe("ready");

    const { nextUtc, lastUtc } = resolveExampleWeeklyMondayInstants(new Date("2026-08-20T15:30:00.000Z"));
    expect(view.nextRunPrimary).not.toBe("—");
    expect(view.lastRunPrimary).not.toBe("—");
    expect(new Date(nextUtc).getTime()).toBeGreaterThan(Date.now());
    expect(new Date(lastUtc).getTime()).toBeLessThan(Date.now());
  });
});
