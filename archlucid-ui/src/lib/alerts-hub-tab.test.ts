import { describe, expect, it } from "vitest";

import {
  alertHubTabFromSearchParam,
  isAlertConfigurationTabParam,
} from "@/lib/alerts-hub-tab";

describe("alerts-hub-tab", () => {
  it("treats bare inbox and tab=inbox as non-configuration (no rules redirect)", () => {
    expect(isAlertConfigurationTabParam("inbox")).toBe(false);
    expect(isAlertConfigurationTabParam(null)).toBe(false);
    expect(isAlertConfigurationTabParam("rules")).toBe(true);
    expect(alertHubTabFromSearchParam("inbox")).toBe("inbox");
  });
});
