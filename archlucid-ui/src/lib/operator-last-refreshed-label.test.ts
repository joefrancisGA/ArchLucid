import { describe, expect, it } from "vitest";

import {
  OPERATOR_NOT_REFRESHED_LABEL,
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator-last-refreshed-label";

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
