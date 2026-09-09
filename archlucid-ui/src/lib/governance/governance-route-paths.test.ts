import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_WORKSPACE_HEALTH_HREF,
  buildCanonicalGovernanceAlertsInboxHref,
  governanceAlertRulesTabHref,
  governanceAlertsTabHref,
} from "@/lib/governance/governance-route-paths";

describe("governance-route-paths", () => {
  it("exposes canonical approval alert paths", () => {
    expect(GOVERNANCE_ALERTS_PATH).toBe("/governance/alerts");
    expect(GOVERNANCE_ALERT_RULES_PATH).toBe("/governance/alert-rules");
    expect(GOVERNANCE_DECISION_REGISTER_PATH).toBe("/governance/decision-register");
    expect(GOVERNANCE_FINDINGS_PATH).toBe("/governance/findings");
    expect(GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH).toBe("/governance/findings/assigned-to-me");
    expect(GOVERNANCE_WORKSPACE_HEALTH_HREF).toBe("/insights/workspace-health");
  });

  it("builds alert-rules tab hrefs on the dedicated configuration route", () => {
    expect(governanceAlertRulesTabHref("rules")).toBe("/governance/alert-rules");
    expect(governanceAlertRulesTabHref("notifications")).toBe("/governance/alert-rules?tab=notifications");
    expect(governanceAlertRulesTabHref("advanced-rules")).toBe("/governance/alert-rules?tab=advanced-rules");
    expect(governanceAlertRulesTabHref("test-alerts")).toBe("/governance/alert-rules?tab=test-alerts");
  });

  it("routes alerts tab deep links to alert-rules configuration", () => {
    expect(governanceAlertsTabHref("inbox")).toBe("/governance/alerts");
    expect(governanceAlertsTabHref("rules")).toBe("/governance/alert-rules");
    expect(governanceAlertsTabHref("notifications")).toBe("/governance/alert-rules?tab=notifications");
    expect(governanceAlertsTabHref("advanced-rules")).toBe("/governance/alert-rules?tab=advanced-rules");
    expect(governanceAlertsTabHref("test-alerts")).toBe("/governance/alert-rules?tab=test-alerts");
  });

  it("strips retired tab=inbox while preserving inbox filters (TB-1594)", () => {
    expect(buildCanonicalGovernanceAlertsInboxHref({ tab: "inbox" })).toBe("/governance/alerts");
    expect(buildCanonicalGovernanceAlertsInboxHref({ tab: "inbox", status: "Open" })).toBe(
      "/governance/alerts?status=Open",
    );
    expect(buildCanonicalGovernanceAlertsInboxHref({ status: "Open", cursor: "abc" })).toBe(
      "/governance/alerts?status=Open&cursor=abc",
    );
  });
});
