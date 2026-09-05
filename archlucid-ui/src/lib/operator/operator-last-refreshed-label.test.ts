import { describe, expect, it } from "vitest";

import {
  OPERATOR_NOT_REFRESHED_LABEL,
  operatorFreshnessMetadataClockValue,
  operatorFreshnessMetadataLabel,
  operatorFreshnessMetadataWithClockLabel,
  operatorHomeDataCurrencyValue,
  operatorLastRefreshedClockLabel,
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";

describe("operatorLastRefreshedClockLabel", () => {
  it("formats single-digit hours without a leading zero and omits seconds", () => {
    const refreshedAt = new Date("2026-01-15T18:07:26.000Z");
    const label = operatorLastRefreshedClockLabel(refreshedAt);

    expect(label).not.toBeNull();
    expect(label).toMatch(/6:07/);
    expect(label).not.toMatch(/6:07:26/);
    expect(label).not.toMatch(/06:07/);
  });
});

describe("operatorFreshnessMetadataClockValue", () => {
  it("keeps single-digit hours without a leading zero in the visible clock", () => {
    const refreshedAt = new Date("2026-01-15T18:07:26.000Z");
    const label = operatorFreshnessMetadataClockValue(refreshedAt);

    expect(label).toMatch(/6:07/);
    expect(label).not.toMatch(/6:07:26/);
    expect(label).not.toMatch(/06:07/);
  });
});

describe("operatorHomeDataCurrencyValue", () => {
  it("uses minute-precision clock when just refreshed", () => {
    const refreshedAt = new Date();
    const label = operatorHomeDataCurrencyValue(refreshedAt);

    expect(label).toMatch(/\d{1,2}:\d{2}/);
    expect(label).not.toMatch(/:\d{2}:\d{2}/);
    expect(label.toLowerCase()).not.toMatch(/\bnow\b/);
  });

  it("uses relative age with a visible clock parenthetical for older refreshes", () => {
    const refreshedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const label = operatorHomeDataCurrencyValue(refreshedAt);

    expect(label).toMatch(/hour/);
    expect(label).toMatch(/\(\d{1,2}:\d{2}/);
  });
});

describe("operatorLastRefreshedLabel", () => {
  it("reports not-refreshed for null and undefined", () => {
    expect(operatorLastRefreshedLabel(null)).toBe(OPERATOR_NOT_REFRESHED_LABEL);
    expect(operatorLastRefreshedLabel(undefined)).toBe(OPERATOR_NOT_REFRESHED_LABEL);
  });

  it("formats a recent refresh as relative age instead of a locale timestamp", () => {
    const label = operatorLastRefreshedLabel(new Date(Date.now() - 5 * 60 * 1000));

    expect(label).toMatch(/minute/);
    expect(label).not.toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });
});

describe("operatorFreshnessMetadataLabel", () => {
  it("omits the prefix before the first refresh so the line does not read as a broken timestamp", () => {
    const label = operatorFreshnessMetadataLabel({
      prefix: "Last refreshed",
      lastRefreshedAt: null,
      refreshingLabel: null,
    });

    expect(label).toBe(OPERATOR_NOT_REFRESHED_LABEL);
    expect(label).not.toMatch(/Last refreshed/);
  });

  it("qualifies a real timestamp with the prefix", () => {
    const label = operatorFreshnessMetadataLabel({
      prefix: "Last refreshed",
      lastRefreshedAt: new Date(Date.now() - 5 * 60 * 1000),
      refreshingLabel: null,
    });

    expect(label).toMatch(/^Last refreshed: /);
    expect(label).toMatch(/minute/);
  });

  it("prefers the in-flight label over both other states", () => {
    expect(
      operatorFreshnessMetadataLabel({
        prefix: "Last refreshed",
        lastRefreshedAt: new Date(),
        refreshingLabel: "Refreshing…",
      }),
    ).toBe("Refreshing…");

    expect(
      operatorFreshnessMetadataLabel({
        prefix: "Last refreshed",
        lastRefreshedAt: null,
        refreshingLabel: "Refreshing…",
      }),
    ).toBe("Refreshing…");
  });

  it("treats undefined like a missing timestamp", () => {
    expect(
      operatorFreshnessMetadataLabel({
        prefix: "Last refreshed",
        lastRefreshedAt: undefined,
        refreshingLabel: null,
      }),
    ).toBe(OPERATOR_NOT_REFRESHED_LABEL);
  });
});

describe("operatorFreshnessMetadataWithClockLabel", () => {
  it("appends a visible clock parenthetical when a timestamp exists", () => {
    const refreshedAt = new Date("2026-01-15T12:00:00.000Z");
    const label = operatorFreshnessMetadataWithClockLabel({
      prefix: "Last refreshed",
      lastRefreshedAt: refreshedAt,
      refreshingLabel: null,
    });

    expect(label).toMatch(/^Last refreshed: /);
    expect(label).toMatch(/\(\d{1,2}:\d{2}/);
    expect(label).not.toMatch(/\d{1,2}:\d{2}:\d{2}/);
    expect(label).not.toContain("title");
  });

  it("omits the locale now relative when a clock timestamp is visible", () => {
    const label = operatorFreshnessMetadataWithClockLabel({
      prefix: "Updated",
      lastRefreshedAt: new Date(),
      refreshingLabel: null,
    });

    expect(label.toLowerCase()).not.toMatch(/\bnow\b/);
    expect(label).toMatch(/^Updated: \d{1,2}:\d{2}/);
    expect(label).not.toMatch(/:\d{2}:\d{2}/);
  });

  it("prefers the in-flight label and omits the clock", () => {
    expect(
      operatorFreshnessMetadataWithClockLabel({
        prefix: "Last refreshed",
        lastRefreshedAt: new Date(),
        refreshingLabel: "Refreshing…",
      }),
    ).toBe("Refreshing…");
  });
});

describe("operatorLastRefreshedExactLabel", () => {
  it("omits the tooltip value when nothing has been refreshed", () => {
    expect(operatorLastRefreshedExactLabel(null)).toBeUndefined();
    expect(operatorLastRefreshedExactLabel(undefined)).toBeUndefined();
  });

  it("keeps the exact timestamp available for the tooltip in a fixed time zone", () => {
    const refreshedAt = new Date("2026-01-15T12:00:00.000Z");

    expect(operatorLastRefreshedExactLabel(refreshedAt)).toBe("Jan 15, 2026, 12:00 PM UTC");
  });
});
