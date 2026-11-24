"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useReviewDetailLastVisited } from "@/hooks/use-review-detail-last-visited";
import { useIncrementalReviewFindingsRefresh } from "@/hooks/use-incremental-review-findings-refresh";
import type { ReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import {
  REVIEW_DETAIL_FINDING_PARAM,
  REVIEW_DETAIL_TAB_PARAM,
  REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM,
  type ReviewDetailTabId,
  readPresenterModeFromSearchParams,
  readPresenterModeFromWindowLocation,
  readReviewDetailTabFromWindowLocation,
  resolveReviewDetailTabFromHash,
  resolveReviewDetailTabFromLocation,
  resolveReviewWorkbenchFocusColumn,
  writeReviewDetailTabToUrl,
  reviewDetailFindingIdClearForTabNavigation,
} from "@/lib/review-detail-workspace-tabs";
import { type ResolveReviewDetailVisibleTabsInput } from "@/lib/resolve-review-detail-visible-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  resolveReviewWorkspaceTabFromSearchParams,
  resolveReviewWorkspaceVisibleTabs,
  hasExplicitLegacyArchTabParam} from "@/lib/resolve-review-workspace-visible-tabs";
import { scheduleScrollToReviewDetailSection, scheduleScrollToReviewFinding } from "@/lib/review-detail-section-scroll";
import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import { useReviewWorkbenchShortcuts } from "@/hooks/use-review-workbench-shortcuts";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useProfessionalWorkbenchEnabled } from "@/lib/workspace-mode/use-professional-workbench-enabled";

import type { ReviewDetailWorkspaceProps } from "@/components/reviews/ReviewDetailWorkspace";
import {
  ARCHITECTURE_DIAGRAM_FINDING_PARAM,
  parseArchitectureDiagramFindingIdFromSearch,
} from "@/lib/architecture/architecture-findings-dual-pane-url";
import { readRoomElicitationFromSearchParams } from "@/lib/reviews/review-room-elicitation-url";
import {
  REVIEW_WORKSPACE_MORE_TABS_OPEN_PARAM,
  parseReviewWorkspaceMoreTabsOpenFromSearch,
} from "@/lib/reviews/review-workspace-more-tabs-url";
import { readPinRunIdFromSearchParams } from "@/lib/reviews/review-pin-run-url";
import { parseReviewHeaderShareMenuOpenFromSearch, REVIEW_HEADER_SHARE_MENU_OPEN_PARAM } from "@/lib/reviews/review-header-share-menu-url";
import { parseReviewShareLinkOpenFromSearch, REVIEW_SHARE_LINK_OPEN_PARAM } from "@/lib/reviews/review-share-link-panels-url";
import { parseReviewMeetingPacketOpenFromSearch, REVIEW_MEETING_PACKET_OPEN_PARAM } from "@/lib/reviews/review-meeting-packet-panels-url";
import { parseReviewFinalizeConfirmOpenFromSearch, parseReviewFinalizeSuccessOpenFromSearch, REVIEW_FINALIZE_CONFIRM_PARAM, REVIEW_FINALIZE_SUCCESS_PARAM } from "@/lib/reviews/review-finalize-confirm-url";
import { parseReviewConsultingExportOpenFromSearch, REVIEW_CONSULTING_EXPORT_OPEN_PARAM } from "@/lib/reviews/review-consulting-export-panels-url";
import { parseReviewGenerateAdrOpenFromSearch, REVIEW_GENERATE_ADR_OPEN_PARAM } from "@/lib/reviews/review-generate-adr-panels-url";
import { parseReviewCliReproduceOpenFromSearch, REVIEW_CLI_REPRODUCE_OPEN_PARAM } from "@/lib/reviews/review-cli-reproduce-disclosure-url";
import { parseReviewDeliverableAudienceFromSearch, parseReviewDeliverableOpenFromSearch, REVIEW_DELIVERABLE_AUDIENCE_PARAM, REVIEW_DELIVERABLE_OPEN_PARAM } from "@/lib/reviews/review-export-deliverable-panels-url";
import { parseReviewArchiveConfirmOpenFromSearch, parseReviewArchiveRunIdFromSearch, REVIEW_ARCHIVE_CONFIRM_PARAM, REVIEW_ARCHIVE_RUN_ID_PARAM } from "@/lib/reviews/review-archive-confirm-url";
import { parseRunDetailRecordMetadataOpenFromSearch, RUN_DETAIL_RECORD_METADATA_OPEN_PARAM } from "@/lib/runs/run-detail-record-metadata-url";
import { parseReviewAskDockOpenFromSearch, parseReviewAskDockThreadIdFromSearch, REVIEW_ASK_DOCK_OPEN_PARAM, REVIEW_ASK_DOCK_THREAD_PARAM } from "@/lib/reviews/review-ask-dock-url";
import {
  parseRunDetailWorkspaceDisclosuresExpandedFromSearch,
  RUN_DETAIL_WORKSPACE_DISCLOSURES_EXPANDED_PARAM,
} from "@/lib/runs/run-detail-workspace-disclosures-expanded-disclosure-url";
import {
  parseReviewPresenterQuestionIdFromSearch,
  REVIEW_PRESENTER_QUESTION_ID_PARAM,
} from "@/lib/reviews/review-presenter-elicitation-url";
import {
  parseReviewPackageSponsorHandoffMoreExportsOpenFromSearch,
  REVIEW_PACKAGE_SPONSOR_HANDOFF_MORE_EXPORTS_OPEN_PARAM,
} from "@/lib/reviews/review-package-sponsor-handoff-more-exports-disclosure-url";
import {
  parseReviewFailureTechnicalMetadataOpenFromSearch,
  REVIEW_FAILURE_TECHNICAL_METADATA_OPEN_PARAM,
} from "@/lib/reviews/review-failure-technical-metadata-disclosure-url";
import {
  parseReviewChainOfCustodySectionKeyFromSearch,
  REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM,
} from "@/lib/reviews/review-chain-of-custody-section-disclosure-url";
import {
  parseSponsorRehearsalPreviewOpenFromSearch,
  SPONSOR_REHEARSAL_PREVIEW_OPEN_PARAM,
} from "@/lib/reviews/sponsor-rehearsal-preview-disclosure-url";
import {
  parseSubmittedArchitectureOpenFromSearch,
  SUBMITTED_ARCHITECTURE_OPEN_PARAM,
} from "@/lib/reviews/submitted-architecture-disclosure-url";
import {
  parseSubmittedArchitectureFullDescriptionOpenFromSearch,
  SUBMITTED_ARCHITECTURE_FULL_DESCRIPTION_OPEN_PARAM,
} from "@/lib/reviews/submitted-architecture-full-description-disclosure-url";
import {
  parseWorkspaceAiProbeDiagnosticsOpenFromSearch,
  WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM,
} from "@/lib/reviews/workspace-ai-probe-diagnostics-disclosure-url";
import {
  parseWorkspaceAiProbeDebugMetadataOpenFromSearch,
  WORKSPACE_AI_PROBE_DEBUG_METADATA_OPEN_PARAM,
} from "@/lib/reviews/workspace-ai-probe-debug-metadata-disclosure-url";
import {
  parseTechnologyBaselineEvidenceRefEntryIdFromSearch,
  TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM,
} from "@/lib/reviews/technology-baseline-evidence-ref-disclosure-url";
import {
  parseTechnologyBaselineEntryIdFromSearch,
  TECHNOLOGY_BASELINE_ENTRY_PARAM,
} from "@/lib/reviews/technology-baseline-rationale-url";
import {
  parseRunImpactAnalysisOpenFromSearch,
  RUN_IMPACT_ANALYSIS_OPEN_PARAM,
} from "@/lib/reviews/run-impact-analysis-disclosure-url";
import {
  parseRunFindingExplainabilityOpenFromSearch,
  RUN_FINDING_EXPLAINABILITY_OPEN_PARAM,
} from "@/lib/reviews/run-finding-explainability-disclosure-url";
import {
  parseRunCoverageCurationOpenFromSearch,
  RUN_COVERAGE_CURATION_OPEN_PARAM,
} from "@/lib/reviews/run-coverage-curation-disclosure-url";
import {
  parseRunDetailStickyActionsTechnicalDetailOpenFromSearch,
  RUN_DETAIL_STICKY_ACTIONS_TECHNICAL_DETAIL_OPEN_PARAM,
} from "@/lib/reviews/run-detail-sticky-actions-technical-detail-disclosure-url";
import {
  parseTransparencyTrailOpenFromSearch,
  TRANSPARENCY_TRAIL_OPEN_PARAM,
} from "@/lib/reviews/transparency-trail-open-url";
import {
  parseRunAssessmentNarrativeOpenFromSearch,
  RUN_ASSESSMENT_NARRATIVE_OPEN_PARAM,
} from "@/lib/reviews/run-assessment-narrative-url";
import {
  parseTerraformAdvisoryExportConfirmOpenFromSearch,
  TERRAFORM_ADVISORY_EXPORT_CONFIRM_PARAM,
} from "@/lib/reviews/terraform-advisory-export-confirm-url";
import {
  parseQuickDecisionShowMutedFromSearch,
  QUICK_DECISION_SHOW_MUTED_PARAM,
} from "@/lib/reviews/quick-decision-muted-filter-url";
import {
  parseQuickDecisionAskFindingIdFromSearch,
  QUICK_DECISION_ASK_FINDING_ID_PARAM,
} from "@/lib/reviews/quick-decision-ask-panels-url";
import {
  parseQuickDecisionReasoningFindingIdFromSearch,
  QUICK_DECISION_REASONING_FINDING_ID_PARAM,
} from "@/lib/reviews/quick-decision-reasoning-panels-url";
import {
  parseQuickDecisionMuteFindingIdFromSearch,
  QUICK_DECISION_MUTE_FINDING_ID_PARAM,
} from "@/lib/reviews/quick-decision-mute-panels-url";
import {
  parseQuickDecisionPolicyPackImpactOpenFromSearch,
  QUICK_DECISION_POLICY_PACK_IMPACT_OPEN_PARAM,
} from "@/lib/findings/quick-decision-policy-pack-impact-disclosure-url";

const WORKBENCH_TAB_IDS: readonly ReviewDetailTabId[] = ["architecture", "findings", "evidence"];

function resolveWorkspaceLifecycle(props: ReviewDetailWorkspaceProps): ReviewWorkspaceLifecycle {
  if (props.lifecycle !== undefined) {
    return props.lifecycle;
  }

  if (props.tabLifecycle !== undefined) {
    const manifestId = props.tabLifecycle.manifestId;

    if ((manifestId ?? "").trim().length > 0) {
      return "finalized";
    }

    if (props.tabLifecycle.showProgressTracker) {
      return "in-review";
    }
  }

  return "finalized";
}

function isWorkbenchTab(tabId: ReviewDetailTabId): tabId is ReviewWorkbenchColumnId {
  return (WORKBENCH_TAB_IDS as readonly string[]).includes(tabId);
}

export type UseReviewDetailWorkspaceTabsResult = {
  readonly activeTab: ReviewDetailTabId;
  readonly navigateTab: (
    tab: ReviewDetailTabId,
    options?: { readonly findingId?: string | null; readonly workbenchFocus?: ReviewWorkbenchColumnId | null },
  ) => void;
  readonly lifecycle: ReviewWorkspaceLifecycle;
  readonly resolved: ReturnType<typeof resolveReviewWorkspaceVisibleTabs>;
  readonly isTabNewSinceLastVisit: (tab: ReviewDetailTabId) => boolean;
  readonly workbenchVisible: boolean;
  readonly workbenchFocusColumn: ReviewWorkbenchColumnId | null;
  readonly setWorkbenchEnabled: (enabled: boolean) => void;
  readonly initialFindingId: string | null;
  readonly initialWorkbenchFocus: ReviewWorkbenchColumnId | null;
  readonly presenterMode: boolean;
  readonly pipelineInFlight: boolean;
  readonly inPipelineBanner: ReviewDetailWorkspaceProps["inPipelineBanner"];
  readonly counts: NonNullable<ReviewDetailWorkspaceProps["tabCounts"]>;
};

export function useReviewDetailWorkspaceTabs(
  props: ReviewDetailWorkspaceProps,
): UseReviewDetailWorkspaceTabsResult {
  const searchParams = useSearchParams();
  const { isWorkingMode } = useWorkspaceMode();
  const initialFindingIdFromParams = useMemo((): string | null => {
    const parsed = parseArchitectureDiagramFindingIdFromSearch(
      searchParams.get(REVIEW_DETAIL_FINDING_PARAM),
      searchParams.get(ARCHITECTURE_DIAGRAM_FINDING_PARAM),
    );

    return parsed.length > 0 ? parsed : null;
  }, [searchParams]);
  const initialFindingId = initialFindingIdFromParams;
  const initialWorkbenchFocus = null;
  const visitDefaultAppliedRef = useRef(false);
  const [presenterMode, setPresenterModeState] = useState(false);
  const presenterModeRef = useRef(presenterMode);
  presenterModeRef.current = presenterMode;
  const [hashResolved, setHashResolved] = useState(false);
  const lifecycle = resolveWorkspaceLifecycle(props);
  const resolved = useMemo(() => {
    if (props.tabLifecycle !== undefined) {
      return resolveReviewWorkspaceVisibleTabs({
        ...props.tabLifecycle,
        lifecycle,
        workingDesk: isWorkingMode});
    }

    const fallbackInput =
      lifecycle === "in-review"
        ? { manifestId: null, showProgressTracker: true, runCompleted: false }
        : { manifestId: "fallback-manifest", showProgressTracker: false, runCompleted: false };

    return resolveReviewWorkspaceVisibleTabs({ ...fallbackInput, lifecycle, workingDesk: isWorkingMode });
  }, [isWorkingMode, lifecycle, props.tabLifecycle]);
  const searchParamTab =
    props.tabLifecycle !== undefined
      ? resolveReviewWorkspaceTabFromSearchParams(
          searchParams,
          resolved,
          lifecycle,
          props.visitDefaultReviewTabWhenUrlSilent,
        )
      : resolveReviewDetailTabFromLocation(null, null);
  const searchParamPresenter = readPresenterModeFromSearchParams(searchParams);
  const searchParamWorkbenchFocus = useMemo((): ReviewWorkbenchColumnId | null => {
    if (props.tabLifecycle === undefined) {
      return null;
    }

    if (!isWorkbenchTab(searchParamTab)) {
      return null;
    }

    const fromParam = resolveReviewWorkbenchFocusColumn(
      searchParams.get(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM),
    );

    if (fromParam !== null) {
      return fromParam;
    }

    return searchParamTab;
  }, [props.tabLifecycle, searchParams, searchParamTab]);
  const [activeTab, setActiveTab] = useState<ReviewDetailTabId>(searchParamTab);
  const [workbenchFocusColumn, setWorkbenchFocusColumnState] =
    useState<ReviewWorkbenchColumnId | null>(searchParamWorkbenchFocus);
  const workbenchFocusColumnRef = useRef(workbenchFocusColumn);
  workbenchFocusColumnRef.current = workbenchFocusColumn;
  const tabActivityAt = props.tabActivityAt ?? {};
  const { isTabNewSinceLastVisit, markTabSeen } = useReviewDetailLastVisited(props.runId, tabActivityAt);

  useEffect(() => {
    if (visitDefaultAppliedRef.current) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const reviewTabPresent = (params.get(REVIEW_DETAIL_TAB_PARAM)?.trim() ?? "").length > 0;
    const findingPresent =
      parseArchitectureDiagramFindingIdFromSearch(
        params.get(REVIEW_DETAIL_FINDING_PARAM),
        params.get(ARCHITECTURE_DIAGRAM_FINDING_PARAM),
      ).length > 0;
    const workbenchFocusPresent =
      (params.get(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM)?.trim() ?? "").length > 0;
    const presenterPresent = readPresenterModeFromSearchParams(params);
    const legacyArchTabPresent = hasExplicitLegacyArchTabParam(params.get("archTab"));
    const roomElicitationPresent = readRoomElicitationFromSearchParams(params);
    const moreTabsOpenPresent = parseReviewWorkspaceMoreTabsOpenFromSearch(
      params.get(REVIEW_WORKSPACE_MORE_TABS_OPEN_PARAM),
    );
    const pinRunPresent = readPinRunIdFromSearchParams(params) !== null;
    const shareMenuOpenPresent = parseReviewHeaderShareMenuOpenFromSearch(params.get(REVIEW_HEADER_SHARE_MENU_OPEN_PARAM));
    const shareLinkOpenPresent = parseReviewShareLinkOpenFromSearch(params.get(REVIEW_SHARE_LINK_OPEN_PARAM));
    const meetingPacketOpenPresent = parseReviewMeetingPacketOpenFromSearch(params.get(REVIEW_MEETING_PACKET_OPEN_PARAM));
    const finalizeConfirmOpenPresent = parseReviewFinalizeConfirmOpenFromSearch(params.get(REVIEW_FINALIZE_CONFIRM_PARAM));
    const finalizeSuccessOpenPresent = parseReviewFinalizeSuccessOpenFromSearch(params.get(REVIEW_FINALIZE_SUCCESS_PARAM));
    const consultingExportOpenPresent = parseReviewConsultingExportOpenFromSearch(params.get(REVIEW_CONSULTING_EXPORT_OPEN_PARAM));
    const generateAdrOpenPresent = parseReviewGenerateAdrOpenFromSearch(params.get(REVIEW_GENERATE_ADR_OPEN_PARAM));
    const cliReproduceOpenPresent = parseReviewCliReproduceOpenFromSearch(params.get(REVIEW_CLI_REPRODUCE_OPEN_PARAM));
    const deliverableOpenPresent = parseReviewDeliverableOpenFromSearch(params.get(REVIEW_DELIVERABLE_OPEN_PARAM));
    const deliverableAudiencePresent = parseReviewDeliverableAudienceFromSearch(params.get(REVIEW_DELIVERABLE_AUDIENCE_PARAM)) !== null;
    const archiveConfirmOpenPresent = parseReviewArchiveConfirmOpenFromSearch(params.get(REVIEW_ARCHIVE_CONFIRM_PARAM));
    const archiveRunIdPresent = parseReviewArchiveRunIdFromSearch(params.get(REVIEW_ARCHIVE_RUN_ID_PARAM)).length > 0;
    const packageSponsorHandoffMoreExportsOpenPresent = parseReviewPackageSponsorHandoffMoreExportsOpenFromSearch(
      params.get(REVIEW_PACKAGE_SPONSOR_HANDOFF_MORE_EXPORTS_OPEN_PARAM),
    );
    const failureTechnicalMetadataOpenPresent = parseReviewFailureTechnicalMetadataOpenFromSearch(
      params.get(REVIEW_FAILURE_TECHNICAL_METADATA_OPEN_PARAM),
    );
    const chainOfCustodySectionKeyPresent =
      parseReviewChainOfCustodySectionKeyFromSearch(params.get(REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM)).length > 0;
    const sponsorRehearsalPreviewOpenPresent = parseSponsorRehearsalPreviewOpenFromSearch(
      params.get(SPONSOR_REHEARSAL_PREVIEW_OPEN_PARAM),
    );
    const submittedArchitectureOpenPresent = parseSubmittedArchitectureOpenFromSearch(
      params.get(SUBMITTED_ARCHITECTURE_OPEN_PARAM),
    );
    const submittedArchitectureFullDescriptionOpenPresent = parseSubmittedArchitectureFullDescriptionOpenFromSearch(
      params.get(SUBMITTED_ARCHITECTURE_FULL_DESCRIPTION_OPEN_PARAM),
    );
    const workspaceAiProbeDiagnosticsOpenPresent = parseWorkspaceAiProbeDiagnosticsOpenFromSearch(
      params.get(WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM),
    );
    const workspaceAiProbeDebugMetadataOpenPresent = parseWorkspaceAiProbeDebugMetadataOpenFromSearch(
      params.get(WORKSPACE_AI_PROBE_DEBUG_METADATA_OPEN_PARAM),
    );
    const technologyBaselineEvidenceRefEntryIdPresent =
      parseTechnologyBaselineEvidenceRefEntryIdFromSearch(params.get(TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM)).length > 0;
    const techEntryIdPresent =
      parseTechnologyBaselineEntryIdFromSearch(params.get(TECHNOLOGY_BASELINE_ENTRY_PARAM)).length > 0;
    const runImpactAnalysisOpenPresent = parseRunImpactAnalysisOpenFromSearch(
      params.get(RUN_IMPACT_ANALYSIS_OPEN_PARAM),
    );
    const runFindingExplainabilityOpenPresent = parseRunFindingExplainabilityOpenFromSearch(
      params.get(RUN_FINDING_EXPLAINABILITY_OPEN_PARAM),
    );
    const runCoverageCurationOpenPresent = parseRunCoverageCurationOpenFromSearch(
      params.get(RUN_COVERAGE_CURATION_OPEN_PARAM),
    );
    const runDetailStickyActionsTechnicalDetailOpenPresent = parseRunDetailStickyActionsTechnicalDetailOpenFromSearch(
      params.get(RUN_DETAIL_STICKY_ACTIONS_TECHNICAL_DETAIL_OPEN_PARAM),
    );
    const transparencyTrailOpenPresent = parseTransparencyTrailOpenFromSearch(
      params.get(TRANSPARENCY_TRAIL_OPEN_PARAM),
    );
    const runAssessmentNarrativeOpenPresent = parseRunAssessmentNarrativeOpenFromSearch(
      params.get(RUN_ASSESSMENT_NARRATIVE_OPEN_PARAM),
    );
    const terraformExportConfirmOpenPresent = parseTerraformAdvisoryExportConfirmOpenFromSearch(
      params.get(TERRAFORM_ADVISORY_EXPORT_CONFIRM_PARAM),
    );
    const quickDecisionShowMutedPresent = parseQuickDecisionShowMutedFromSearch(
      params.get(QUICK_DECISION_SHOW_MUTED_PARAM),
    );
    const quickDecisionAskFindingIdPresent =
      parseQuickDecisionAskFindingIdFromSearch(params.get(QUICK_DECISION_ASK_FINDING_ID_PARAM)).length > 0;
    const quickDecisionReasoningFindingIdPresent =
      parseQuickDecisionReasoningFindingIdFromSearch(params.get(QUICK_DECISION_REASONING_FINDING_ID_PARAM)).length > 0;
    const quickDecisionMuteFindingIdPresent =
      parseQuickDecisionMuteFindingIdFromSearch(params.get(QUICK_DECISION_MUTE_FINDING_ID_PARAM)).length > 0;
    const quickDecisionPolicyPackImpactOpenPresent = parseQuickDecisionPolicyPackImpactOpenFromSearch(
      params.get(QUICK_DECISION_POLICY_PACK_IMPACT_OPEN_PARAM),
    );
    const runRecordMetaOpenPresent = parseRunDetailRecordMetadataOpenFromSearch(params.get(RUN_DETAIL_RECORD_METADATA_OPEN_PARAM));
    const askDockOpenPresent = parseReviewAskDockOpenFromSearch(params.get(REVIEW_ASK_DOCK_OPEN_PARAM));
    const askThreadPresent =
      parseReviewAskDockThreadIdFromSearch(params.get(REVIEW_ASK_DOCK_THREAD_PARAM)).length > 0;
    const workspaceDisclosuresExpandedPresent =
      parseRunDetailWorkspaceDisclosuresExpandedFromSearch(
        params.get(RUN_DETAIL_WORKSPACE_DISCLOSURES_EXPANDED_PARAM),
      ) !== null;
    const presenterQuestionIdPresent =
      parseReviewPresenterQuestionIdFromSearch(params.get(REVIEW_PRESENTER_QUESTION_ID_PARAM)).length > 0;
    const hashPresent = window.location.hash.replace(/^#/, "").trim().length > 0;

    if (
      reviewTabPresent
      || findingPresent
      || workbenchFocusPresent
      || presenterPresent
      || legacyArchTabPresent
      || roomElicitationPresent
      || moreTabsOpenPresent
      || pinRunPresent
      || shareMenuOpenPresent
      || shareLinkOpenPresent
      || meetingPacketOpenPresent
      || finalizeConfirmOpenPresent
      || finalizeSuccessOpenPresent
      || consultingExportOpenPresent
      || generateAdrOpenPresent
      || cliReproduceOpenPresent
      || deliverableOpenPresent
      || deliverableAudiencePresent
      || archiveConfirmOpenPresent
      || archiveRunIdPresent
      || packageSponsorHandoffMoreExportsOpenPresent
      || failureTechnicalMetadataOpenPresent
      || chainOfCustodySectionKeyPresent
      || sponsorRehearsalPreviewOpenPresent
      || submittedArchitectureOpenPresent
      || submittedArchitectureFullDescriptionOpenPresent
      || workspaceAiProbeDiagnosticsOpenPresent
      || workspaceAiProbeDebugMetadataOpenPresent
      || technologyBaselineEvidenceRefEntryIdPresent
      || techEntryIdPresent
      || runImpactAnalysisOpenPresent
      || runFindingExplainabilityOpenPresent
      || runCoverageCurationOpenPresent
      || runDetailStickyActionsTechnicalDetailOpenPresent
      || transparencyTrailOpenPresent
      || runAssessmentNarrativeOpenPresent
      || terraformExportConfirmOpenPresent
      || quickDecisionShowMutedPresent
      || quickDecisionAskFindingIdPresent
      || quickDecisionReasoningFindingIdPresent
      || quickDecisionMuteFindingIdPresent
      || quickDecisionPolicyPackImpactOpenPresent
      || runRecordMetaOpenPresent
      || askDockOpenPresent
      || askThreadPresent
      || workspaceDisclosuresExpandedPresent
      || presenterQuestionIdPresent
      || hashPresent
    ) {
      visitDefaultAppliedRef.current = true;

      return;
    }

    const defaultTab = props.visitDefaultReviewTabWhenUrlSilent ?? null;

    if (defaultTab === null) {
      visitDefaultAppliedRef.current = true;

      return;
    }

    visitDefaultAppliedRef.current = true;

    if (defaultTab === "findings") {
      const findingId = props.visitDefaultFindingIdWhenUrlSilent?.trim() ?? "";
      const defaultHash = props.visitDefaultReviewHashWhenUrlSilent?.trim() ?? "";

      writeReviewDetailTabToUrl("findings", {
        findingId: findingId.length > 0 ? findingId : undefined,
        hash: defaultHash.length > 0 ? defaultHash : undefined,
        runId: props.runId,
        architectureId: props.parentArchitectureId,
      });
      setActiveTab("findings");

      if (defaultHash.length > 0) {
        scheduleScrollToReviewDetailSection(defaultHash);
      }

      if (findingId.length > 0) {
        scheduleScrollToReviewFinding(findingId);
      }

      return;
    }

    const defaultHash = props.visitDefaultReviewHashWhenUrlSilent?.trim() ?? "";

    writeReviewDetailTabToUrl(defaultTab, {
      hash: defaultHash.length > 0 ? defaultHash : undefined,
      runId: props.runId,
      architectureId: props.parentArchitectureId,
    });
    setActiveTab(defaultTab);

    if (defaultHash.length > 0) {
      scheduleScrollToReviewDetailSection(defaultHash);
    }
  }, [
    props.parentArchitectureId,
    props.runId,
    props.visitDefaultFindingIdWhenUrlSilent,
    props.visitDefaultReviewHashWhenUrlSilent,
    props.visitDefaultReviewTabWhenUrlSilent,
  ]);

  useEffect(() => {
    setActiveTab((current) => (current === searchParamTab ? current : searchParamTab));
  }, [searchParamTab]);

  useEffect(() => {
    setWorkbenchFocusColumnState((current) =>
      current === searchParamWorkbenchFocus ? current : searchParamWorkbenchFocus,
    );
    workbenchFocusColumnRef.current = searchParamWorkbenchFocus;
  }, [searchParamWorkbenchFocus]);

  useEffect(() => {
    if (typeof window === "undefined" || props.tabLifecycle === undefined) {
      return;
    }

    if (isWorkbenchTab(activeTab)) {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (!params.has(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM)) {
      return;
    }

    const hash = window.location.hash.slice(1);

    writeReviewDetailTabToUrl(activeTab, {
      hash: hash.length > 0 ? hash : null,
      workbenchFocus: null,
      presenter: presenterModeRef.current ? true : null,
      runId: props.runId,
      architectureId: props.parentArchitectureId,
    });
    workbenchFocusColumnRef.current = null;
    setWorkbenchFocusColumnState(null);
  }, [activeTab, props.parentArchitectureId, props.runId, props.tabLifecycle]);

  useEffect(() => {
    // Next.js client navigations update useSearchParams without a popstate event.
    if (presenterModeRef.current === searchParamPresenter) {
      return;
    }

    presenterModeRef.current = searchParamPresenter;
    setPresenterModeState(searchParamPresenter);
  }, [searchParamPresenter]);

  useEffect(() => {
    const syncActiveTabFromUrl = (): void => {
      const params = new URLSearchParams(window.location.search);
      const nextTab =
        props.tabLifecycle !== undefined
          ? resolveReviewWorkspaceTabFromSearchParams(
              params,
              resolveReviewWorkspaceVisibleTabs({
                ...props.tabLifecycle,
                lifecycle,
                workingDesk: isWorkingMode,
              }),
              lifecycle,
              props.visitDefaultReviewTabWhenUrlSilent,
            )
          : readReviewDetailTabFromWindowLocation();

      setActiveTab((current) => (current === nextTab ? current : nextTab));

      const nextPresenterMode = readPresenterModeFromWindowLocation();

      if (presenterModeRef.current !== nextPresenterMode) {
        presenterModeRef.current = nextPresenterMode;
        setPresenterModeState(nextPresenterMode);
      }

      const nextWorkbenchFocus = resolveReviewWorkbenchFocusColumn(
        new URLSearchParams(window.location.search).get(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM),
      );
      const normalizedFocus = isWorkbenchTab(nextTab)
        ? (nextWorkbenchFocus ?? nextTab)
        : null;

      if (workbenchFocusColumnRef.current !== normalizedFocus) {
        workbenchFocusColumnRef.current = normalizedFocus;
        setWorkbenchFocusColumnState(normalizedFocus);
      }

      if (!isWorkbenchTab(nextTab) && params.has(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM)) {
        const hash = window.location.hash.slice(1);

        writeReviewDetailTabToUrl(nextTab, {
          hash: hash.length > 0 ? hash : null,
          workbenchFocus: null,
          presenter: presenterModeRef.current ? true : null,
          runId: props.runId,
          architectureId: props.parentArchitectureId,
        });
      }
    };

    syncActiveTabFromUrl();
    window.addEventListener("popstate", syncActiveTabFromUrl);

    return () => {
      window.removeEventListener("popstate", syncActiveTabFromUrl);
    };
  }, [isWorkingMode, lifecycle, props.tabLifecycle, props.visitDefaultReviewTabWhenUrlSilent]);

  const navigateTab = useCallback(
    (tab: ReviewDetailTabId, options?: { readonly findingId?: string | null; readonly workbenchFocus?: ReviewWorkbenchColumnId | null }) => {
      const nextWorkbenchFocus = options?.workbenchFocus ?? (isWorkbenchTab(tab) ? tab : null);

      setActiveTab(tab);
      setWorkbenchFocusColumnState(nextWorkbenchFocus);
      workbenchFocusColumnRef.current = nextWorkbenchFocus;
      writeReviewDetailTabToUrl(tab, {
        hash: null,
        findingId: options?.findingId !== undefined
          ? options.findingId
          : reviewDetailFindingIdClearForTabNavigation(tab),
        workbenchFocus: nextWorkbenchFocus,
        presenter: presenterModeRef.current ? true : null,
        runId: props.runId,
        architectureId: props.parentArchitectureId,
      });
      markTabSeen(tab);
    },
    [markTabSeen, props.parentArchitectureId, props.runId],
  );

  useEffect(() => {
    if (hashResolved) {
      return;
    }

    const hash = window.location.hash.slice(1);
    const tabFromHash = resolveReviewDetailTabFromHash(hash);

    if (tabFromHash === null) {
      setHashResolved(true);

      return;
    }

    // A section hash names the tab on first paint. Do not keep the query workbenchFocus on a non-workbench tab.
    const normalizedFocus = isWorkbenchTab(tabFromHash) ? tabFromHash : null;

    setActiveTab(tabFromHash);

    if (workbenchFocusColumnRef.current !== normalizedFocus) {
      workbenchFocusColumnRef.current = normalizedFocus;
      setWorkbenchFocusColumnState(normalizedFocus);
    }

    writeReviewDetailTabToUrl(tabFromHash, {
      hash,
      findingId: reviewDetailFindingIdClearForTabNavigation(tabFromHash),
      workbenchFocus: normalizedFocus,
      presenter: presenterModeRef.current ? true : null,
      runId: props.runId,
      architectureId: props.parentArchitectureId,
    });
    setHashResolved(true);

    if (hash.length > 0) {
      scheduleScrollToReviewDetailSection(hash);
    }
  }, [hashResolved, props.parentArchitectureId, props.runId]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);

    if (hash.length === 0) {
      return;
    }

    const tabFromHash = resolveReviewDetailTabFromHash(hash);

    if (tabFromHash !== null && tabFromHash !== activeTab) {
      return;
    }

    scheduleScrollToReviewDetailSection(hash);
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(window.location.search);
      const tabFromHash = resolveReviewDetailTabFromHash(hash);
      const nextTab = tabFromHash ?? (
        props.tabLifecycle === undefined
          ? readReviewDetailTabFromWindowLocation()
          : resolveReviewWorkspaceTabFromSearchParams(
              params,
              resolved,
              lifecycle,
              props.visitDefaultReviewTabWhenUrlSilent,
            )
      );

      setActiveTab((current) => (current === nextTab ? current : nextTab));

      // A section hash names the tab. Do not keep a stale workbenchFocus query on a non-workbench tab.
      const normalizedFocus = tabFromHash !== null
        ? (isWorkbenchTab(nextTab) ? nextTab : null)
        : (isWorkbenchTab(nextTab)
          ? (resolveReviewWorkbenchFocusColumn(params.get(REVIEW_DETAIL_WORKBENCH_FOCUS_PARAM)) ?? nextTab)
          : null);

      if (workbenchFocusColumnRef.current !== normalizedFocus) {
        workbenchFocusColumnRef.current = normalizedFocus;
        setWorkbenchFocusColumnState(normalizedFocus);
      }

      if (tabFromHash !== null) {
        writeReviewDetailTabToUrl(nextTab, {
          hash: hash.length > 0 ? hash : null,
          findingId: reviewDetailFindingIdClearForTabNavigation(nextTab),
          workbenchFocus: normalizedFocus,
          presenter: presenterModeRef.current ? true : null,
          runId: props.runId,
          architectureId: props.parentArchitectureId,
        });
      }

      if (hash.length === 0) {
        return;
      }

      scheduleScrollToReviewDetailSection(hash);
    };

    window.addEventListener("hashchange", onHashChange);

    return () => window.removeEventListener("hashchange", onHashChange);
  }, [lifecycle, props.parentArchitectureId, props.runId, props.tabLifecycle, props.visitDefaultReviewTabWhenUrlSilent, resolved]);

  const counts = props.tabCounts ?? {};
  const inPipelineBanner = props.inPipelineBanner ?? null;
  const pipelineInFlight =
    props.tabLifecycle?.showProgressTracker === true && props.tabLifecycle.runCompleted !== true;

  useIncrementalReviewFindingsRefresh({
    runId: props.runId,
    enabled: pipelineInFlight});

  const workbench = useProfessionalWorkbenchEnabled();
  const workbenchVisible =
    workbench.mounted
    && workbench.enabled
    && WORKBENCH_TAB_IDS.every(
      (tabId) => resolved.visibleTabIds.includes(tabId) || resolved.moreTabIds.includes(tabId),
    );

  useReviewWorkbenchShortcuts({
    enabled: workbenchVisible,
    onFocusColumn: (column) => navigateTab(column, { workbenchFocus: column })});

  return {
    activeTab,
    navigateTab,
    lifecycle,
    resolved,
    isTabNewSinceLastVisit,
    workbenchVisible,
    workbenchFocusColumn,
    setWorkbenchEnabled: workbench.setEnabled,
    initialFindingId,
    initialWorkbenchFocus,
    presenterMode,
    pipelineInFlight,
    inPipelineBanner,
    counts};
}

export { isWorkbenchTab, WORKBENCH_TAB_IDS };
