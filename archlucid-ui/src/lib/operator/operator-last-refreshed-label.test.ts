import { describe, expect, it } from "vitest";

import {
  OPERATOR_NOT_REFRESHED_LABEL,
  operatorFreshnessMetadataLabel,
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";

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

describe("operatorLastRefreshedExactLabel", () => {
  it("omits the tooltip value when nothing has been refreshed", () => {
    expect(operatorLastRefreshedExactLabel(null)).toBeUndefined();
    expect(operatorLastRefreshedExactLabel(undefined)).toBeUndefined();
  });

  it("keeps the exact locale timestamp available for the tooltip", () => {
    const refreshedAt = new Date("2026-01-15T12:00:00.000Z");

    expect(operatorLastRefreshedExactLabel(refreshedAt)).toBe(refreshedAt.toLocaleString());
  });
});
