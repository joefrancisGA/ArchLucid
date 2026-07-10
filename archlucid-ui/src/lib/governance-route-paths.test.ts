import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_ALERTS_PATH,
  governanceAlertRulesTabHref,
  governanceAlertsTabHref,
} from "@/lib/governance-route-paths";

describe("governance-route-paths", () => {
  it("exposes canonical governance alert paths", () => {
    expect(GOVERNANCE_ALERTS_PATH).toBe("/governance/alerts");
    expect(GOVERNANCE_ALERT_RULES_PATH).toBe("/governance/alert-rules");
  });

  it("builds alert-rules tab hrefs on the dedicated configuration route", () => {
    expect(governanceAlertRulesTabHref("rules")).toBe("/governance/alert-rules");
    expect(governanceAlertRulesTabHref("routing")).toBe("/governance/alert-rules?tab=routing");
  });

  it("routes legacy alerts tab deep links to alert-rules configuration", () => {
    expect(governanceAlertsTabHref("inbox")).toBe("/governance/alerts");
    expect(governanceAlertsTabHref("rules")).toBe("/governance/alert-rules");
    expect(governanceAlertsTabHref("routing")).toBe("/governance/alert-rules?tab=routing");
  });
});
