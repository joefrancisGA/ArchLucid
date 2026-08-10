import { describe, expect, it } from "vitest";

import {
  ALERT_RULE_THRESHOLD_MAX,
  ALERT_RULE_THRESHOLD_MIN,
  describeAlertRuleScope,
  describeThresholdComparison,
  formatAlertRulePreview,
  formatPersistedAlertRuleSummary,
  isAlertRuleFormValid,
  labelForAlertRuleType,
  resolveAlertRuleNotificationReadiness,
  resolveAlertRuleScopePreviewProjectId,
  validateAlertRuleForm,
} from "@/lib/alert-rule-conditions";
import type { AlertRule } from "@/types/alerts";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

const sampleRule: AlertRule = {
  ruleId: "rule-1",
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "default",
  name: "Critical finding watch",
  ruleType: "CriticalRecommendationCount",
  severity: "High",
  thresholdValue: 3,
  isEnabled: true,
  targetChannelType: "DigestOnly",
  metadataJson: "{}",
  createdUtc: "2026-01-01T00:00:00Z",
};

describe("alert-rule-conditions", () => {
  it("labels CriticalRecommendationCount with finding vocabulary", () => {
    expect(labelForAlertRuleType("CriticalRecommendationCount")).toContain("finding");
    expect(labelForAlertRuleType("CriticalRecommendationCount")).not.toContain("recommendation");
  });

  it("formats preview with alert priority distinct from finding severity", () => {
    const preview = formatAlertRulePreview({
      name: "Watch critical findings",
      ruleType: "CriticalRecommendationCount",
      alertPriority: "High",
      thresholdValue: 3,
    });

    expect(preview).toContain("High");
    expect(preview).toContain("at least 3");
  });

  it("states acceptance-rate comparison as falls below", () => {
    expect(describeThresholdComparison("AcceptanceRateDrop")).toContain("falls below");
    expect(
      formatAlertRulePreview({
        name: "Low acceptance",
        ruleType: "AcceptanceRateDrop",
        alertPriority: "Warning",
        thresholdValue: 40,
      }),
    ).toContain("falls below 40%");
  });

  it("validates integer thresholds for count-based rules", () => {
    const errors = validateAlertRuleForm({
      name: "Rule",
      ruleType: "CriticalRecommendationCount",
      alertPriority: "Warning",
      thresholdValue: 2.5,
    });

    expect(errors.thresholdValue).toContain("whole number");
  });

  it("enforces threshold bounds", () => {
    const errors = validateAlertRuleForm({
      name: "Rule",
      ruleType: "CriticalRecommendationCount",
      alertPriority: "Warning",
      thresholdValue: ALERT_RULE_THRESHOLD_MAX + 1,
    });

    expect(errors.thresholdValue).toContain(String(ALERT_RULE_THRESHOLD_MIN));
  });

  it("skips threshold validation for rejected-security rules", () => {
    expect(
      isAlertRuleFormValid({
        name: "Rejected security",
        ruleType: "RejectedSecurityRecommendation",
        alertPriority: "Critical",
        thresholdValue: Number.NaN,
      }),
    ).toBe(true);
  });

  it("matches persisted rule semantics in summary formatter", () => {
    expect(formatPersistedAlertRuleSummary(sampleRule)).toBe(
      formatAlertRulePreview({
        name: sampleRule.name,
        ruleType: sampleRule.ruleType,
        alertPriority: sampleRule.severity,
        thresholdValue: sampleRule.thresholdValue,
      }),
    );
  });

  it("describes workspace scope for default project", () => {
    expect(describeAlertRuleScope(sampleRule)).toContain("workspace");
  });

  it("omits invented default when persisted and session project ids are absent", () => {
    expect(resolveAlertRuleScopePreviewProjectId(undefined, undefined)).toBe("");
    expect(resolveAlertRuleScopePreviewProjectId("  ", null)).toBe("");
    expect(describeAlertRuleScope({ projectId: "" })).toContain("workspace");
  });

  it("prefers persisted projectId over session for scope preview", () => {
    expect(resolveAlertRuleScopePreviewProjectId("persisted-proj", "session-proj")).toBe("persisted-proj");
  });

  it("uses session projectId when the rules list has no persisted project", () => {
    expect(resolveAlertRuleScopePreviewProjectId(undefined, "session-proj")).toBe("session-proj");
    expect(describeAlertRuleScope({ projectId: "session-proj" })).toContain("project scope");
  });

  it("resolves notification readiness from routing subscriptions", () => {
    const subscriptions: AlertRoutingSubscription[] = [
      {
        routingSubscriptionId: "sub-1",
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "default",
        name: "Email",
        channelType: "Email",
        destination: "ops@example.com",
        minimumSeverity: "High",
        isEnabled: true,
        metadataJson: "{}",
        createdUtc: "2026-01-01T00:00:00Z",
      },
    ];

    const readiness = resolveAlertRuleNotificationReadiness(sampleRule, subscriptions);

    expect(readiness.inAppAlertsEnabled).toBe(true);
    expect(readiness.externalNotificationsConfigured).toBe(true);
  });
});
