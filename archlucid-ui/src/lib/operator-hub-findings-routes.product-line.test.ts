import { describe, expect, it } from "vitest";

import { resolveAdministrationHubSources } from "@/lib/administration-hub-evidence-copy";
import { resolveAlertsHelpRelatedConcepts } from "@/lib/alerts-help-guide-content";
import { resolveAlertsInboxOrientationSources } from "@/lib/alerts-inbox-evidence-copy";
import { resolveAdvisoryScansHelpTileItems } from "@/lib/advisory-scans-help-guide-content";
import { resolveApprovalLineageSources } from "@/lib/approval-lineage-evidence-copy";
import { resolveApprovalQueueSources } from "@/lib/approval-queue-evidence-copy";
import { buildArchitectureIntelligenceProductLinks } from "@/lib/architecture/architecture-intelligence-product-links";
import { buildArchitectureIntelligenceSources } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { buildAskReviewQuestionsSources } from "@/lib/ask-review-questions-evidence-copy";
import { resolveAuditTrailHelpSources } from "@/lib/audit-trail-help-evidence-copy";
import { resolveAuditTrailOrientationSources } from "@/lib/audit-trail-evidence-copy";
import { resolveAzureBoardsSetupSteps } from "@/lib/azure-boards-setup-steps";
import { resolveDecisionRegisterOrientationSources } from "@/lib/decision-register-evidence-copy";
import { resolveDigestsBrowseOrientationSources } from "@/lib/digests-browse-evidence-copy";
import { resolveDigestsSources } from "@/lib/digests-evidence-copy";
import { resolveOperatorHomeOrientationSources } from "@/lib/operator/operator-home-evidence-copy";
import { resolvePlanningSources } from "@/lib/planning-evidence-copy";
import { resolvePolicyPacksHubOrientationSources } from "@/lib/policy/policy-packs-hub-evidence-copy";
import { buildReviewsHubSources } from "@/lib/reviews-hub-evidence-copy";
import { buildReviewWorkspaceSources } from "@/lib/review-workspace-evidence-copy";
import { resolveRiskExceptionsOrientationSources } from "@/lib/risk-exceptions-evidence-copy";
import { resolveSearchReviewEvidenceHelpSources } from "@/lib/search-review-evidence-help-evidence-copy";
import { resolveSearchReviewEvidenceSources } from "@/lib/search-review-evidence-evidence-copy";
import { resolveSignedRecordOrientationSources } from "@/lib/signed-record-evidence-copy";
import { resolveContextualHelpDrawerSources } from "@/lib/contextual-help-drawer-evidence-copy";
import { buildEvidenceTraceSources } from "@/lib/evidence-trace-evidence-copy";
import { resolveGovernanceAssignedToMeOrientationSources } from "@/lib/governance/governance-assigned-to-me-evidence-copy";
import { resolveGovernanceSetupOrientationSources } from "@/lib/governance/governance-setup-evidence-copy";
import { resolveRecurrenceSchedulesHelpSources } from "@/lib/recurrence-schedules-help-evidence-copy";
import { resolveRecurrenceSchedulesOrientationSources } from "@/lib/recurrence-schedules-evidence-copy";
import { resolveSignedRecordArtifactOrientationSources } from "@/lib/signed-record-artifact-evidence-copy";
import { resolveStandardsRulesOrientationSources } from "@/lib/standards-rules-evidence-copy";
import { buildAlertsFindingsVocabulary } from "@/lib/vocabulary/alerts-findings-vocabulary";
import { resolveGettingStartedHelpWorkflowStepsForProductLine } from "@/lib/getting-started-help-guide-content";
import { resolveImprovementPlanningHelpOutputTileItems } from "@/lib/improvement-planning-help-guide-content";
import { resolveReviewScorecardFindingsHref } from "@/lib/pilot-scorecard-present";
import { resolveWorkingFindingsInstrumentHref } from "@/lib/resolve-working-findings-instrument-href";
import { isGovernanceFindingsQueueHeaderSearchPath } from "@/lib/shell-header-route-local-search";
import { buildCommandPaletteCuratedTasks } from "@/lib/command-palette-curated-tasks";
import { resolveGovernanceApprovalHelpPrimaryActions } from "@/lib/governance/governance-approval-help-guide-content";
import { resolveHelpDocsStaticEntries } from "@/lib/help/help-docs-static-entries";
import { APPROVAL_QUEUE_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/approval-queue-rows";
import { localizePageContextualHelpEntry } from "@/lib/contextual-help/localize-page-contextual-help-entry";
import { resolveRegistryShortcutRoute, SHORTCUTS } from "@/lib/shortcut-registry";
import { resolveSponsorKpiDrillThrough } from "@/lib/sponsor/sponsor-kpi-drill-through-hrefs";
import { remapGovernanceOperatorHref } from "@/lib/product-line/securenow-compliance-routes";
import { buildStaticFindPageSearchIndex } from "@/lib/find-page-search-index";
import { workspaceOpenFindingsPresentation } from "@/lib/metric-count-presentation";
import {
  resolveReviewsHubSummaryFindingsHref,
  resolveReviewsHubSummaryOpenRisksHref,
} from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-summary-destinations";
import { resolveDigestsHelpContentItems } from "@/lib/digests-help-guide-content";
import { resolveStandardsRulesHelpTableItems } from "@/lib/standards-rules-help-guide-content";
import { buildSettingsMasterSections } from "@/app/(operator)/administration/_sections/settings-master-catalog";
import { resolveStandardsRulesEmptyCompact } from "@/lib/enterprise-compact-empty-state-presets-governance";
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
  return sources.find(
    (source) =>
      source.label === "Findings"
      || source.label === "Findings queue"
      || source.label === "Findings tab",
  )?.href;
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
    expect(findingsHrefFromSources(resolveDecisionRegisterOrientationSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveRiskExceptionsOrientationSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveOperatorHomeOrientationSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(buildReviewsHubSources(false, "architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(
      buildReviewWorkspaceSources("", null, { productLine: "architecture" }).find((s) => s.label === "Findings queue")
        ?.href,
    ).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(buildArchitectureIntelligenceSources(false, "architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveDigestsSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveDigestsBrowseOrientationSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveSearchReviewEvidenceSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveSearchReviewEvidenceHelpSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolvePolicyPacksHubOrientationSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveSignedRecordOrientationSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolvePlanningSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveGovernanceSetupOrientationSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveStandardsRulesOrientationSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveGovernanceAssignedToMeOrientationSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveRecurrenceSchedulesOrientationSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveRecurrenceSchedulesHelpSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveSignedRecordArtifactOrientationSources("architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveContextualHelpDrawerSources("architecture"))).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(findingsHrefFromSources(buildEvidenceTraceSources("run-1", "finding-1", "architecture"))).toBe(
      GOVERNANCE_FINDINGS_PATH,
    );
    expect(buildAlertsFindingsVocabulary("architecture").findingsLink.href).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(resolveReviewScorecardFindingsHref("architecture")).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(
      resolveWorkingFindingsInstrumentHref({ isWorkingMode: false, productLine: "architecture" }),
    ).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(
      resolveImprovementPlanningHelpOutputTileItems("architecture").find((item) => item.label === "Findings triage")
        ?.href,
    ).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(isGovernanceFindingsQueueHeaderSearchPath(GOVERNANCE_FINDINGS_PATH)).toBe(true);
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
    expect(findingsHrefFromSources(resolveDecisionRegisterOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveRiskExceptionsOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveOperatorHomeOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(buildReviewsHubSources(false, "security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      buildReviewWorkspaceSources("", null, { productLine: "security" }).find((s) => s.label === "Findings queue")?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(buildArchitectureIntelligenceSources(false, "security"))).toBe(
      SECURENOW_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveDigestsSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveDigestsBrowseOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveSearchReviewEvidenceSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveSearchReviewEvidenceHelpSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolvePolicyPacksHubOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveSignedRecordOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolvePlanningSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveGovernanceSetupOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveStandardsRulesOrientationSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveGovernanceAssignedToMeOrientationSources("security"))).toBe(
      SECURENOW_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveRecurrenceSchedulesOrientationSources("security"))).toBe(
      SECURENOW_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveRecurrenceSchedulesHelpSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(resolveSignedRecordArtifactOrientationSources("security"))).toBe(
      SECURENOW_FINDINGS_PATH,
    );
    expect(findingsHrefFromSources(resolveContextualHelpDrawerSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsHrefFromSources(buildEvidenceTraceSources("run-1", "finding-1", "security"))).toBe(
      SECURENOW_FINDINGS_PATH,
    );
    expect(buildAlertsFindingsVocabulary("security").findingsLink.href).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      resolveGovernanceSetupOrientationSources("security").find((s) => s.label === "Policy packs")?.href,
    ).toBe(SECURENOW_POLICY_PACKS_PATH);
    expect(resolveReviewScorecardFindingsHref("security")).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      resolveWorkingFindingsInstrumentHref({ isWorkingMode: false, productLine: "security" }),
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      resolveImprovementPlanningHelpOutputTileItems("security").find((item) => item.label === "Findings triage")?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      resolveGettingStartedHelpWorkflowStepsForProductLine(false, "security").find((step) => step.stepNumber === 3)
        ?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(isGovernanceFindingsQueueHeaderSearchPath(SECURENOW_FINDINGS_PATH)).toBe(true);

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

    const findingsShortcut = SHORTCUTS.find((entry) => entry.key === "alt+g");
    expect(findingsShortcut).toBeDefined();
    expect(resolveRegistryShortcutRoute(findingsShortcut!, "security")).toBe(SECURENOW_FINDINGS_PATH);

    const policyPaletteTask = buildCommandPaletteCuratedTasks("security").find((task) => task.label === "Policy packs");
    expect(policyPaletteTask?.href).toBe(SECURENOW_POLICY_PACKS_PATH);

    expect(resolveGovernanceApprovalHelpPrimaryActions("security").openFindings.href).toBe(SECURENOW_FINDINGS_PATH);

    const helpFindingsEntry = resolveHelpDocsStaticEntries("security").find((entry) => entry.title === "Findings queue");
    expect(helpFindingsEntry?.url).toBe(SECURENOW_FINDINGS_PATH);

    const approvalQueueHelp = localizePageContextualHelpEntry(
      APPROVAL_QUEUE_CONTEXTUAL_HELP_ROWS[0]!.entry,
      "security",
    );
    expect(approvalQueueHelp.whatToDoNextAction?.href).toBe(SECURENOW_FINDINGS_PATH);

    expect(
      remapGovernanceOperatorHref("/governance/findings?filter=open", "security"),
    ).toBe(`${SECURENOW_FINDINGS_PATH}?filter=open`);

    expect(resolveSponsorKpiDrillThrough("security").decisionsNeeded).toBe(
      `${SECURENOW_FINDINGS_PATH}?filter=needs-decision`,
    );

    expect(resolveReviewsHubSummaryFindingsHref("security")).toBe(SECURENOW_FINDINGS_PATH);
    expect(resolveReviewsHubSummaryOpenRisksHref("security")).toBe(`${SECURENOW_FINDINGS_PATH}?filter=open`);
    expect(workspaceOpenFindingsPresentation(3, "security").href).toBe(`${SECURENOW_FINDINGS_PATH}?filter=open`);

    const findIndexPolicyPack = buildStaticFindPageSearchIndex("security").find(
      (entry) => entry.label === "Policy packs",
    );
    expect(findIndexPolicyPack?.href).toBe(SECURENOW_POLICY_PACKS_PATH);

    const digestFindings = resolveDigestsHelpContentItems("security").find((item) => item.label === "Findings summary");
    expect(digestFindings?.href).toBe(SECURENOW_FINDINGS_PATH);

    const standardsPacks = resolveStandardsRulesHelpTableItems("security").find((item) => item.label === "Policy packs");
    expect(standardsPacks?.href).toBe(SECURENOW_POLICY_PACKS_PATH);

    const settingsPolicyPack = buildSettingsMasterSections("security")
      .flatMap((section) => section.destinations)
      .find((destination) => destination.id === "policy-packs-hub");
    expect(settingsPolicyPack?.href).toBe(SECURENOW_POLICY_PACKS_PATH);

    expect(resolveStandardsRulesEmptyCompact("security").actions[0]?.href).toBe(SECURENOW_POLICY_PACKS_PATH);
  });
});
