import { describe, expect, it } from "vitest";

import {
  ALERT_RULES_ALERTS_INBOX_COMPACT_LINE,
  ALERT_RULES_ALERTS_INBOX_HEADING,
  ALERT_RULES_ALERTS_INBOX_INBOX_LINK,
  ALERT_RULES_ALERTS_INBOX_RULES_LINK,
  ALERT_RULES_ALERTS_INBOX_WHY_TWO,
  buildAlertRulesAlertsInboxVocabulary,
  resolveAlertRulesAlertsInboxPeerLink,
} from "@/lib/vocabulary/alert-rules-alerts-inbox-vocabulary";
import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_ALERTS_PATH,
} from "@/lib/governance/governance-route-paths";

describe("alert-rules-alerts-inbox-vocabulary (TB-2289)", () => {
  it("explains alert rules config vs alerts inbox triage", () => {
    const model = buildAlertRulesAlertsInboxVocabulary();

    expect(model.heading).toBe(ALERT_RULES_ALERTS_INBOX_HEADING);
    expect(model.heading.toLowerCase()).toContain("alert rules");
    expect(model.heading.toLowerCase()).toContain("alerts inbox");
    expect(model.whyTwo).toBe(ALERT_RULES_ALERTS_INBOX_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("configure");
    expect(model.whyTwo.toLowerCase()).toContain("triage");
    expect(model.compactLine).toBe(ALERT_RULES_ALERTS_INBOX_COMPACT_LINE);

    expect(model.alertRulesLink).toEqual(ALERT_RULES_ALERTS_INBOX_RULES_LINK);
    expect(model.alertRulesLink.href).toBe(GOVERNANCE_ALERT_RULES_PATH);
    expect(model.alertRulesLink.href).toBe("/governance/alert-rules");

    expect(model.alertsInboxLink).toEqual(ALERT_RULES_ALERTS_INBOX_INBOX_LINK);
    expect(model.alertsInboxLink.href).toBe(GOVERNANCE_ALERTS_PATH);
    expect(model.alertsInboxLink.href).toBe("/governance/alerts");
  });

  it("resolves the peer surface from alert rules and alerts inbox", () => {
    expect(resolveAlertRulesAlertsInboxPeerLink("alert-rules")).toEqual(
      ALERT_RULES_ALERTS_INBOX_INBOX_LINK,
    );

    expect(resolveAlertRulesAlertsInboxPeerLink("alerts-inbox")).toEqual(
      ALERT_RULES_ALERTS_INBOX_RULES_LINK,
    );
  });
});
