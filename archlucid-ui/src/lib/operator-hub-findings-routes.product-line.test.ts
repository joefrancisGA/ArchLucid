import { describe, expect, it } from "vitest";

import { resolveAdministrationHubSources } from "@/lib/administration-hub-evidence-copy";
import { resolveAlertsHelpRelatedConcepts } from "@/lib/alerts-help-guide-content";
import { resolveAlertsInboxOrientationSources } from "@/lib/alerts-inbox-evidence-copy";
import { resolveAdvisoryScansHelpTileItems } from "@/lib/advisory-scans-help-guide-content";
import { resolveApprovalLineageSources } from "@/lib/approval-lineage-evidence-copy";
import { resolveApprovalQueueSources } from "@/lib/approval-queue-evidence-copy";
import { buildArchitectureIntelligenceProductLinks } from "@/lib/architecture/architecture-intelligence-product-links";
import { buildAskReviewQuestionsSources } from "@/lib/ask-review-questions-evidence-copy";
import { resolveAuditTrailHelpSources } from "@/lib/audit-trail-help-evidence-copy";
import { resolveAuditTrailOrientationSources } from "@/lib/audit-trail-evidence-copy";
import { resolveAzureBoardsSetupSteps } from "@/lib/azure-boards-setup-steps";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_RESOLUTION_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";

function findingsHrefFromSources(
  sources: readonly { readonly label: string; readonly href: string }[],
): string | undefined {
  return sources.find((source) => source.label === "Findings" || source.label === "Findings queue")?.href;
}

describe("operator hub findings routes product line", () => {
  it("keeps architecture defaults on governance findings", () => {
    expect(findingsHrefFromSources(resolveAdministrationHubSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveAlertsInboxOrientationSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveApprovalQueueSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveApprovalLineageSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveAuditTrailOrientationSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveAuditTrailHelpSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(buildAskReviewQuestionsSources(false, "architecture").find((s) => s.label === "Findings queue")?.href).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(
      resolveAzureBoardsSetupSteps({
        nativeEnabled: true,
        credentialsReady: true,
        settingsReady: true,
        health: { reachable: true },
        productLine: "architecture",
      }).find((step) => step.id === "create")?.href,
    ).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(buildArchitectureIntelligenceProductLinks("run-abc", "architecture")?.findingsHref).toBe(
      `${GOVERNANCE_FINDINGS_PATH}?runId=run-abc`,
    );
  });

  it("routes SecureNow operator surfaces to compliance findings and policy hubs", () => {
    expect(findingsHrefFromSources(resolveAdministrationHubSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveAlertsInboxOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveApprovalQueueSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveApprovalLineageSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveAuditTrailOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveAuditTrailHelpSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(buildAskReviewQuestionsSources(false, "security").find((s) => s.label === "Findings queue")?.href).toBe(
      SECURENOW_FINDINGS_PATH,
    );
    expect(
      resolveAzureBoardsSetupSteps({
        nativeEnabled: true,
        credentialsReady: true,
        settingsReady: true,
        health: { reachable: true },
        productLine: "security",
      }).find((step) => step.id === "create")?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(buildArchitectureIntelligenceProductLinks("run-abc", "security")?.findingsHref).toBe(
      `${SECURENOW_FINDINGS_PATH}?runId=run-abc`,
    );

    const findingsTile = resolveAdvisoryScansHelpTileItems("security").find((item) => item.label === "Findings triage");
    expect(findingsTile?.href).toBe(SECURENOW_FINDINGS_PATH);

    const policyConcept = resolveAlertsHelpRelatedConcepts("security").find((item) => item.title === "Policy packs");
    const standardsConcept = resolveAlertsHelpRelatedConcepts("security").find(
      (item) => item.title === "Standards and rules",
    );
    expect(policyConcept?.href).toBe(SECURENOW_POLICY_PACKS_PATH);
    expect(standardsConcept?.href).toBe(SECURENOW_STANDARDS_AND_RULES_PATH);
    expect(policyConcept?.href).not.toBe(GOVERNANCE_POLICY_PACKS_PATH);
    expect(standardsConcept?.href).not.toBe(GOVERNANCE_RESOLUTION_PATH);
  });
});
