import { describe, expect, it } from "vitest";

import {
  alertHubTabFromSearchParam,
  alertRulesHubTabFromSearchParam,
  isAlertConfigurationTabParam,
} from "@/lib/alerts-hub-tab";

describe("alerts-hub-tab", () => {
  it("treats bare inbox and tab=inbox as non-configuration (no rules redirect)", () => {
    expect(isAlertConfigurationTabParam("inbox")).toBe(false);
    expect(isAlertConfigurationTabParam(null)).toBe(false);
    expect(isAlertConfigurationTabParam("rules")).toBe(true);
    expect(isAlertConfigurationTabParam("notifications")).toBe(true);
    expect(isAlertConfigurationTabParam("advanced-rules")).toBe(true);
    expect(isAlertConfigurationTabParam("test-alerts")).toBe(true);
    expect(alertHubTabFromSearchParam("inbox")).toBe("inbox");
  });

  it("resolves renamed tab ids and ignores retired aliases", () => {
    expect(alertRulesHubTabFromSearchParam("notifications")).toBe("notifications");
    expect(alertRulesHubTabFromSearchParam("advanced-rules")).toBe("advanced-rules");
    expect(alertRulesHubTabFromSearchParam("test-alerts")).toBe("test-alerts");
    expect(alertRulesHubTabFromSearchParam("routing")).toBe("rules");
    expect(alertRulesHubTabFromSearchParam("composite")).toBe("rules");
    expect(alertRulesHubTabFromSearchParam("simulation")).toBe("rules");
    expect(isAlertConfigurationTabParam("routing")).toBe(false);
    expect(isAlertConfigurationTabParam("composite")).toBe(false);
    expect(isAlertConfigurationTabParam("simulation")).toBe(false);
  });
});
