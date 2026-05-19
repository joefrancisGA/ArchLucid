import { describe, expect, it } from "vitest";

import { computeNextRunUtc, computeNextScheduledRunTimes } from "./simple-scan-schedule-calculator";

describe("simple-scan-schedule-calculator", () => {
  it("matches server aliases and daily-at-7 rule", () => {
    const from = new Date(Date.UTC(2026, 2, 26, 10, 0, 0));

    expect(computeNextRunUtc("@hourly", from)?.toISOString()).toBe(
      new Date(Date.UTC(2026, 2, 26, 11, 0, 0)).toISOString(),
    );
    expect(computeNextRunUtc("@daily", from)?.toISOString()).toBe(
      new Date(Date.UTC(2026, 2, 27, 10, 0, 0)).toISOString(),
    );
    expect(computeNextRunUtc("@weekly", from)?.toISOString()).toBe(
      new Date(Date.UTC(2026, 3, 2, 10, 0, 0)).toISOString(),
    );

    const beforeSeven = new Date(Date.UTC(2026, 2, 26, 5, 0, 0));
    expect(computeNextRunUtc("0 7 * * *", beforeSeven)?.toISOString()).toBe(
      new Date(Date.UTC(2026, 2, 26, 7, 0, 0)).toISOString(),
    );

    const afterSeven = new Date(Date.UTC(2026, 2, 26, 8, 0, 0));
    expect(computeNextRunUtc("0 7 * * *", afterSeven)?.toISOString()).toBe(
      new Date(Date.UTC(2026, 2, 27, 7, 0, 0)).toISOString(),
    );
  });

  it("returns five chained preview instants for hourly", () => {
    const from = new Date(Date.UTC(2026, 2, 26, 10, 0, 0));
    const runs = computeNextScheduledRunTimes("@hourly", 5, from);

    expect(runs).toHaveLength(5);
    expect(runs[0]?.toISOString()).toBe(new Date(Date.UTC(2026, 2, 26, 11, 0, 0)).toISOString());
    expect(runs[4]?.toISOString()).toBe(new Date(Date.UTC(2026, 2, 26, 15, 0, 0)).toISOString());
  });
});
