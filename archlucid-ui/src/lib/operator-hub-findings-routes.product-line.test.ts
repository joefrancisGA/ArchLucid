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
import { resolveWorkingDeskToolHref } from "@/lib/resolve-working-desk-tool-href";
import { resolveWorkingFindingsInstrumentHref } from "@/lib/resolve-working-findings-instrument-href";
import { resolveInviteeHomeOrientationCopy } from "@/lib/invitee-first-orientation";
import { repeatReviewLoopHelpLoopSteps } from "@/lib/repeat-review-loop-help-loop-steps";
import {
  resolveSearchReviewEvidenceHelpFindingsHref,
  resolveSearchReviewEvidenceHelpPrecondition,
} from "@/lib/search-review-evidence-help-guide-content";
import { resolveFocusedPilotShowcaseFindingsHref } from "@/lib/standards-rules-focused-pilot-showcase";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { resolveRecurrenceSchedulesRiskRegisterHref } from "@/lib/recurrence-schedules-copy";
import { governanceFindingsQueueNextReviewHref } from "@/components/governance/findings/GovernanceFindingsQueueNextReviewFooter";
import { resolveArchitectureCreatedFindingsSources } from "@/lib/architecture/architecture-created-findings-sources";
import { resolveRiskRegisterCsvExportBasename } from "@/lib/architecture/architecture-risk-register-csv";
import { resolveGovernanceApprovalHelpSources } from "@/lib/governance/governance-approval-help-evidence-copy";
import { collectHelpSearchPanelTopics } from "@/lib/help/help-search-panel-catalog-topics";
import { recentViewLabelFromPathname } from "@/lib/operator/operator-recent-views";
import { resolvePolicyPackDeltaDemoHelpSources } from "@/lib/policy/policy-pack-delta-demo-help-guide-content";
import { pageContextualHintForPathname } from "@/lib/page-contextual-hints";
import { readGovernanceFindingsReturnHref } from "@/lib/governance/governance-findings-return-state";
import { resolveRunDetailActivityPreCommitSources } from "@/lib/runs/run-detail-activity-sources";
import { resolveSponsorWorkspaceHealthSources } from "@/lib/sponsor/sponsor-workspace-health-page-copy";
import { buildBuyerCommandPaletteCuratedTasks } from "@/lib/command-palette-buyer-curated-tasks";
import { reportProblemSurfacesForPathname } from "@/lib/report-problem-surfaces";
import { operatorRouteReadiness } from "@/lib/route-readiness";
import { resolveShellHeaderSearchLabel } from "@/lib/shell-header-search-label";
import { troubleshootingCommonIssues } from "@/lib/troubleshooting-help-guide-content";
import { isGovernanceFindingsQueueHeaderSearchPath } from "@/lib/shell-header-route-local-search";
import { buildCommandPaletteCuratedTasks } from "@/lib/command-palette-curated-tasks";
import { resolveGovernanceApprovalHelpPrimaryActions } from "@/lib/governance/governance-approval-help-guide-content";
import { resolveHelpDocsStaticEntries } from "@/lib/help/help-docs-static-entries";
import { APPROVAL_QUEUE_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/approval-queue-rows";
import { localizePageContextualHelpEntry } from "@/lib/contextual-help/localize-page-contextual-help-entry";
import { resolveRegistryShortcutRoute, SHORTCUTS } from "@/lib/shortcut-registry";
import { resolveSponsorKpiDrillThrough } from "@/lib/sponsor/sponsor-kpi-drill-through-hrefs";
import {
  findingsPathForProductLine,
  policyPackDetailPathForProductLine,
  remapGovernanceOperatorHref,
} from "@/lib/product-line/securenow-compliance-routes";
import { buildDecisionRegisterEmptyTeaching } from "@/lib/decision-register-empty-teaching";
import { pathnameShowsContextualHelpFab } from "@/lib/page-contextual-help-fab-paths";
import { provenanceReferenceHref } from "@/lib/provenance-reference-href";
import { resolveSecureNowFindingsQueueOpenGate } from "@/lib/product-line/securenow-findings-queue-open-gate";
import { buildPatternLibraryPolicyPacksVocabulary } from "@/lib/vocabulary/pattern-library-policy-packs-vocabulary";
import { resolvePatternLibraryPolicyPacksHubPath } from "@/lib/pattern-library-policy-guidance-copy";
import type { ArchitectureLinkageNode } from "@/types/architecture-provenance";
import { buildStaticFindPageSearchIndex } from "@/lib/find-page-search-index";
import {
  reviewFindingsGovernanceQueuePresentation,
  workspaceOpenFindingsPresentation,
} from "@/lib/metric-count-presentation";
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
  SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
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

    expect(
      resolveWorkingFindingsInstrumentHref({
        isWorkingMode: true,
        architectureId: "arch-1",
        runId: "run-abc",
        productLine: "security",
      }),
    ).toBe(`${SECURENOW_FINDINGS_PATH}?runId=run-abc`);
    expect(
      resolveWorkingDeskToolHref({
        tool: "findings",
        lastOpenArchitectureId: "arch-1",
        productLine: "security",
      }),
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      reviewFindingsGovernanceQueuePresentation(
        "run-abc",
        2,
        { architectureId: "arch-1", isWorkingMode: true },
        "security",
      ).href,
    ).toBe(`${SECURENOW_FINDINGS_PATH}?runId=run-abc`);
    expect(resolveInviteeHomeOrientationCopy("security").findingsCtaHref).toBe(SECURENOW_FINDINGS_PATH);
    expect(repeatReviewLoopHelpLoopSteps("security").find((step) => step.stepNumber === 4)?.href).toBe(
      SECURENOW_POLICY_PACKS_PATH,
    );
    expect(resolveSearchReviewEvidenceHelpFindingsHref("security")).toBe(SECURENOW_FINDINGS_PATH);
    expect(resolveSearchReviewEvidenceHelpPrecondition("security")).not.toContain("architecture review");

    expect(resolveRecurrenceSchedulesRiskRegisterHref("security")).toBe(SECURENOW_FINDINGS_PATH);
    expect(resolveFocusedPilotShowcaseFindingsHref("security")).toBe(
      `${SECURENOW_FINDINGS_PATH}?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    );
    expect(policyPackDetailPathForProductLine("security", "pack-1")).toBe(
      `${SECURENOW_POLICY_PACKS_PATH}/pack-1`,
    );
    expect(governanceFindingsQueueNextReviewHref("run-abc", undefined, "security")).toBe(
      `${SECURENOW_FINDINGS_PATH}?runId=run-abc`,
    );
    expect(resolveRiskRegisterCsvExportBasename("security")).toBe("compliance-findings-register");

    const helpFindingsTopic = collectHelpSearchPanelTopics(false, "security").find(
      (topic) => topic.id === "risk-register",
    );
    expect(helpFindingsTopic?.action.kind === "route" && helpFindingsTopic.action.href).toBe(SECURENOW_FINDINGS_PATH);

    const helpAssignedTopic = collectHelpSearchPanelTopics(false, "security").find(
      (topic) => topic.id === "triage-assigned-findings",
    );
    expect(
      helpAssignedTopic?.action.kind === "route" && helpAssignedTopic.action.href,
    ).toBe(SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH);

    expect(recentViewLabelFromPathname(SECURENOW_FINDINGS_PATH)).toBe("Findings");
    expect(findingsHrefFromSources(resolveGovernanceApprovalHelpSources("security"))).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      resolvePolicyPackDeltaDemoHelpSources("security").find((source) => source.label === "Findings queue")?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      resolveArchitectureCreatedFindingsSources("security").find((source) => source.label === "Findings queue")?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);

    expect(pageContextualHintForPathname(SECURENOW_FINDINGS_PATH)?.id).toBe("compliance-findings");
    expect(
      resolveRunDetailActivityPreCommitSources("security").find((source) => source.label === "Findings queue")?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      resolveSponsorWorkspaceHealthSources("security").find((source) => source.label === "Findings")?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(
      buildBuyerCommandPaletteCuratedTasks("security").find((task) => task.label === "Findings")?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);
    expect(readGovernanceFindingsReturnHref("security")).toBe(SECURENOW_FINDINGS_PATH);

    expect(
      reportProblemSurfacesForPathname(SECURENOW_FINDINGS_PATH).some(
        (surface) => surface.id === "compliance-findings-queue-hard-failure",
      ),
    ).toBe(true);
    expect(
      reportProblemSurfacesForPathname(SECURENOW_POLICY_PACKS_PATH).some(
        (surface) => surface.id === "compliance-policy-packs-hub-hard-failure",
      ),
    ).toBe(true);
    expect(
      resolveSecureNowFindingsQueueOpenGate("security", {
        isAssignedToMe: false,
        pendingOwner: 0,
        openRisks: 1,
        overdueReview: 0,
      })[0]?.href,
    ).toBe(`${SECURENOW_FINDINGS_PATH}?filter=open`);
    expect(operatorRouteReadiness(SECURENOW_FINDINGS_PATH)).toBe("advanced-only");
    expect(resolveShellHeaderSearchLabel(SECURENOW_FINDINGS_PATH, "architecture")).toBe("Filter findings");
    expect(
      troubleshootingCommonIssues("security").find((issue) => issue.id === "findings-count-wrong")?.nextSteps?.[0]?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);

    expect(pathnameShowsContextualHelpFab(`${SECURENOW_POLICY_PACKS_PATH}/healthcare-claims`)).toBe(true);
    expect(resolvePatternLibraryPolicyPacksHubPath("security")).toBe(SECURENOW_POLICY_PACKS_PATH);
    expect(buildPatternLibraryPolicyPacksVocabulary("security").policyPacksLink.href).toBe(
      SECURENOW_POLICY_PACKS_PATH,
    );
    expect(
      buildDecisionRegisterEmptyTeaching({ productLine: "security" }).actions.find(
        (action) => action.id === "triage-findings",
      )?.href,
    ).toBe(SECURENOW_FINDINGS_PATH);

    const policyPackNodes: ArchitectureLinkageNode[] = [
      { id: "n-pack", type: "PolicyPack", referenceId: "pack-1", name: "Pack" },
    ];
    expect(
      provenanceReferenceHref("run-1", "pack-1", policyPackNodes, { productLine: "security" }),
    ).toBe(policyPackDetailPathForProductLine("security", "pack-1"));
    expect(findingsPathForProductLine("security")).toBe(SECURENOW_FINDINGS_PATH);
  });
});
