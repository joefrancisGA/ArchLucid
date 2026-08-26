"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AlertsFindingsVocabularyRail } from "@/components/AlertsFindingsVocabularyRail";
import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import { GovernanceApprovalStatusBanner } from "@/components/governance/GovernanceApprovalStatusBanner";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { EnterpriseInlineErrorNotification } from "@/components/EnterpriseInlineErrorNotification";
import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/findings/FindingsQueueSearchEvidenceVocabularyRail";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { GovernanceFindingsAssignedToMeBreadcrumb } from "@/components/governance/findings/GovernanceFindingsAssignedToMeBreadcrumb";
import { GovernanceFindingsBuyerChrome } from "@/components/governance/findings/GovernanceFindingsBuyerChrome";
import { GovernanceFindingsQueueBreadcrumb } from "@/components/governance/findings/GovernanceFindingsQueueBreadcrumb";
import { PolicyPackAssignFromReviewStrip } from "@/components/governance/PolicyPackAssignFromReviewStrip";
import { GovernanceFindingsRelatedQueuesDisclosure } from "@/components/governance/findings/GovernanceFindingsRelatedQueuesDisclosure";
import { RiskExceptionsFindingsVocabularyRail } from "@/components/RiskExceptionsFindingsVocabularyRail";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  GovernanceFindingsAssignedToMeHeaderActions,
  GovernanceFindingsAssignedToMeHeaderMetadata,
  GovernanceFindingsAssignedToMeStatusBadge,
} from "@/app/(operator)/governance/findings/GovernanceFindingsAssignedToMeHeader";
import { FindingsKeyboardTriageCoach } from "@/components/usability/FindingsKeyboardTriageCoach";
import { AssignedToMeContinueOldestFindingStrip } from "@/components/usability/AssignedToMeContinueOldestFindingStrip";
import { FindingsTriageFirstFindingStrip } from "@/components/usability/FindingsTriageFirstFindingStrip";
import { GovernanceFindingsContinueLastViewedRow } from "@/app/(operator)/governance/findings/GovernanceFindingsContinueLastViewedRow";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { GovernanceFindingsFilterBar } from "@/components/governance/findings/GovernanceFindingsFilterBar";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { FindingsQueuePickReviewBeforeTriageStrip } from "@/components/governance/findings/FindingsQueuePickReviewBeforeTriageStrip";
import { GovernanceFindingsQueueNextReviewFooterClient } from "@/components/governance/findings/GovernanceFindingsQueueNextReviewFooterClient";
import { ArchitecturePosturePillarOverview } from "@/components/governance/posture/ArchitecturePosturePillarOverview";
import { GovernanceFindingsQueueActiveFilterChips } from "@/components/governance/findings/GovernanceFindingsQueueActiveFilterChips";
import { GovernanceFindingsList } from "@/components/governance/findings/GovernanceFindingsList";
import { SponsorStorySynopsisFromCounts } from "@/components/operator/SponsorStorySynopsisPanel";
import { Button } from "@/components/ui/button";
import { useGovernanceFindingsFilter } from "@/components/governance/findings/use-governance-findings-filter";
import { useGovernanceFindingsQuery } from "@/components/governance/findings/use-governance-findings-query";
import { useAssignedToMeFindingsQuery } from "@/components/governance/findings/use-assigned-to-me-findings-query";
import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
import { useRunDetailWorkspaceContextBundleQuery } from "@/hooks/use-run-detail-workspace-context-bundle-query";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import {
  ARCHITECTURE_RISK_REGISTER_EMPTY_BODY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_TITLE,
  ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF,
} from "@/lib/architecture/architecture-risk-register-page";
import {
  BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD,
  BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE,
  BUYER_RISK_REGISTER_EMPTY_BODY,
  BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION,
  BUYER_RISK_REGISTER_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID,
  GOVERNANCE_FINDINGS_SKIP_LINK_LABEL,
} from "@/lib/governance-findings-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";
import { hasGovernanceApprovalProvenance } from "@/lib/governance/governance-approval-provenance";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_FILTER_NO_MATCH_COMPACT,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_LOAD_FAILED_COMPACT,
  GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT,
  GOVERNANCE_FINDINGS_LOAD_FAILED_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import {
  buildGovernanceAssignedToMeEmptyDescription,
  GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_HREF,
  GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL,
  resolveGovernanceAssignedToMeWorkspaceLabel,
} from "@/lib/governance/governance-assigned-to-me-empty-state";
import {
  resolveFindingsQueueTriageEmphasizedStepId,
  resolveFindingsQueueTriageSteps,
} from "@/lib/findings-queue-triage-checklist";
import { comparePageHrefWithLifecycleAnchor, COMPARE_FINDING_LIFECYCLE_ANCHOR } from "@/lib/compare-finding-lifecycle";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import type { GovernanceJobId } from "@/lib/governance/governance-job-router";
import { governanceRegisterMetricPresentation } from "@/lib/metric-count-presentation";
import {
  EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings/findings-natural-language-filter";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { secondaryViewFromGovernanceQueueRow } from "@/lib/canonical-object-home-registry";
import {
  patchGovernanceFindingsQueueFacets,
  readGovernanceFindingsQueueFacets,
} from "@/lib/governance/governance-findings-queue-facets-storage";
import { usePrefetchItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FINDING_JOB_VIEW,
  FINDING_JOB_VIEW_LABELS,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { resolveEffectiveFindingJobView } from "@/lib/findings/finding-job-view";
import {
  computeGovernanceFindingsRegisterSummary,
  countAssignedToMeLoadedFindings,
  deriveGovernanceFindingsActiveFiltersSummary,
  deriveSponsorSynopsisCounts,
  deriveSponsorSynopsisPackageTitle,
  extractGovernanceFindingIds,
  filterGovernanceFindingsDisplayedRows,
  filterGovernanceFindingsScopedRows,
  hasAssignedToMeCountMismatch,
  resolveAssignedToMeOldestFindingTarget,
  resolveContinueLastFindingTarget,
  resolveFirstFindingTriageTarget,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";

export type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

export type { GovernanceFindingsQueueMode };

export type GovernanceFindingsQueueClientProps = {
  readonly mode?: GovernanceFindingsQueueMode;
};

/**
 * Findings hub: cross-run queue from explainability aggregates, plus a deterministic PHI sample row in public demo mode.
 */
export default function GovernanceFindingsQueueClient({
  mode = "tenant",
}: GovernanceFindingsQueueClientProps) {
  const [selectedFindingIds, setSelectedFindingIds] = useState<ReadonlySet<string>>(new Set());
  const [jobView, setJobViewState] = useState<FindingJobView>(
    () => readGovernanceFindingsQueueFacets(mode).jobView,
  );
  const [nlFacets, setNlFacetsState] = useState<FindingsNaturalLanguageFacets>(
    () => readGovernanceFindingsQueueFacets(mode).nlFacets,
  );
  const isAssignedToMe = mode === "assigned-to-me";
  const { currentPrincipal } = useOperatorNavAuthority();
  const scopeKey = useOperatorScopeQueryKey();
  const scopeRecord = useOperatorScopeRecord();
  const assignedToMeWorkspaceLabel = useMemo(() => resolveGovernanceAssignedToMeWorkspaceLabel(), [scopeKey.workspaceId]);
  const tenantQuery = useGovernanceFindingsQuery(!isAssignedToMe);
  const assignedToMeQuery = useAssignedToMeFindingsQuery(isAssignedToMe);
  const assignedToMeCountQuery = useAssignedToMeFindingsCountQuery({ enabled: isAssignedToMe });
  const activeQuery = isAssignedToMe ? assignedToMeQuery : tenantQuery;
  const { rows, loading, loadFailed, refresh } = activeQuery;
  const assignedToMeFetchBasis = isAssignedToMe ? assignedToMeQuery.fetchBasis : null;
  const assignedToMeCheckedAt =
    isAssignedToMe && assignedToMeQuery.dataUpdatedAt > 0
      ? new Date(assignedToMeQuery.dataUpdatedAt)
      : null;
  const loadFailure = isAssignedToMe ? assignedToMeQuery.loadFailure : tenantQuery.loadFailure;
  const {
    registerFilter,
    setRegisterFilter,
    scopedRunId,
    savedPresets,
    saveCurrentFilterAsPreset,
    removePreset,
    groupByResource,
    toggleGroupByResource,
  } = useGovernanceFindingsFilter({ mode });

  const scopedRunContextQuery = useRunDetailWorkspaceContextBundleQuery(scopedRunId ?? "", {
    enabled: scopedRunId !== null && scopedRunId.length > 0,
  });
  const scopedFindingLifecycleCompareHref = useMemo(() => {
    if (scopedRunId === null || scopedRunId.length === 0) {
      return null;
    }

    const laterOnlyHref = `${comparePageHrefAdaptive("", scopedRunId)}#${COMPARE_FINDING_LIFECYCLE_ANCHOR}`;
    const priorRunId = scopedRunContextQuery.data?.priorCommittedRunId?.trim() ?? "";

    if (priorRunId.length === 0) {
      return laterOnlyHref;
    }

    return comparePageHrefWithLifecycleAnchor(priorRunId, scopedRunId);
  }, [scopedRunContextQuery.data?.priorCommittedRunId, scopedRunId]);

  const setJobView = useCallback((next: FindingJobView): void => {
    setJobViewState(next);
    patchGovernanceFindingsQueueFacets({ jobView: next }, mode);
  }, [mode]);

  const setNlFacets = useCallback((next: FindingsNaturalLanguageFacets): void => {
    setNlFacetsState(next);
    patchGovernanceFindingsQueueFacets({ nlFacets: next }, mode);
  }, [mode]);

  const clearAllFilters = useCallback((): void => {
    setRegisterFilter("all");
    setJobViewState(DEFAULT_FINDING_JOB_VIEW);
    setNlFacetsState(EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS);
    patchGovernanceFindingsQueueFacets(
      {
        registerFilter: "all",
        jobView: DEFAULT_FINDING_JOB_VIEW,
        nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
      },
      mode,
    );
  }, [mode, setRegisterFilter]);

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunFilterActive = scopedRunId !== null && scopedRunId.trim().length > 0;
  const workspaceScopeTeaching =
    !isAssignedToMe && !scopedRunFilterActive
      ? resolveWorkspaceScopeEmptyTeachingForHub({
          listEmpty: !loading && rows.length === 0 && !loadFailed,
          scopeRecord,
          objectPlural: "findings",
        })
      : null;
  const filterBarVisible = !buyerPolishedShell && !loading && rows.length > 0;
  const effectiveJobView = resolveEffectiveFindingJobView(jobView, filterBarVisible);
  const jobViewFilterActive = filterBarVisible && jobView !== DEFAULT_FINDING_JOB_VIEW;
  const scopedRows = useMemo(
    () => filterGovernanceFindingsScopedRows(rows, scopedRunId),
    [rows, scopedRunId],
  );
  const displayedRows = useMemo(
    () =>
      filterGovernanceFindingsDisplayedRows(
        scopedRows,
        registerFilter,
        nlFacets,
        effectiveJobView,
      ),
    [scopedRows, registerFilter, effectiveJobView, nlFacets],
  );
  /**
   * Scoped rows, not all rows: when `?runId=` is set, each header metric is labelled "in this review"
   * by {@link governanceRegisterMetricPresentation} and its drill-in href carries the same `runId`, so a
   * tenant-wide count here would read as a review count and disagree with the list below it.
   * Facet filters (register filter, job view, natural-language) are deliberately excluded — the header
   * describes the review, and the filter chips describe the narrowed list.
   */
  const registerSummary = useMemo(
    () => computeGovernanceFindingsRegisterSummary(scopedRows),
    [scopedRows],
  );
  const findingIds = useMemo(() => extractGovernanceFindingIds(displayedRows), [displayedRows]);
  usePrefetchItsmFindingCorrelations(findingIds);
  const pageTitle =
    isAssignedToMe
      ? "Assigned to me"
      : buyerPolishedShell
        ? BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE
        : ARCHITECTURE_RISK_REGISTER_PAGE_TITLE;
  const pageSubtitle =
    isAssignedToMe
      ? "Open findings assigned to you for remediation across reviews in this workspace."
      : buyerPolishedShell
        ? BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD
        : ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE;
  const navHref = isAssignedToMe ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH : GOVERNANCE_FINDINGS_PATH;

  const onPickReviewForTriage = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);
      router.replace(`${navHref}?${params.toString()}`, { scroll: false });
    },
    [navHref, router, searchParams],
  );

  const currentJobId: GovernanceJobId = isAssignedToMe ? "assigned-to-me-findings" : "triage-findings";
  const loadFailedPreset = isAssignedToMe
    ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_LOAD_FAILED_COMPACT
    : GOVERNANCE_FINDINGS_LOAD_FAILED_COMPACT;
  const filterNoMatchPreset = isAssignedToMe
    ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_FILTER_NO_MATCH_COMPACT
    : GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT;
  const secondaryViewPresentation =
    displayedRows.length > 0 ? secondaryViewFromGovernanceQueueRow(displayedRows[0]) : null;
  const firstFindingTriageTarget = useMemo(
    () => resolveFirstFindingTriageTarget(displayedRows, isAssignedToMe),
    [displayedRows, isAssignedToMe],
  );
  const continueLastFinding = useMemo(
    () => resolveContinueLastFindingTarget(displayedRows),
    [displayedRows],
  );
  const findingsQueueTriageSteps = useMemo(
    () =>
      resolveFindingsQueueTriageSteps({
        reviewPicked: scopedRunFilterActive,
        findingOpened: continueLastFinding !== null,
        dispositionRecorded: displayedRows.some(
          (row) =>
            row.recordKind === "finding" && (row.latestDisposition?.trim() ?? "").length > 0,
        ),
      }),
    [continueLastFinding, displayedRows, scopedRunFilterActive],
  );
  const findingsQueueTriageEmphasizedStepId = useMemo(
    () =>
      resolveFindingsQueueTriageEmphasizedStepId({
        reviewPicked: scopedRunFilterActive,
        findingOpened: continueLastFinding !== null,
        dispositionRecorded: displayedRows.some(
          (row) =>
            row.recordKind === "finding" && (row.latestDisposition?.trim() ?? "").length > 0,
        ),
      }),
    [continueLastFinding, displayedRows, scopedRunFilterActive],
  );
  const assignedToMeOldestFindingTarget = useMemo(
    () => resolveAssignedToMeOldestFindingTarget(rows, isAssignedToMe),
    [isAssignedToMe, rows],
  );
  const sponsorSynopsisPackageTitle = deriveSponsorSynopsisPackageTitle(displayedRows, scopedRunId);
  const sponsorSynopsisCounts = useMemo(
    () => deriveSponsorSynopsisCounts(displayedRows),
    [displayedRows],
  );
  const sponsorHandoffHref =
    scopedRunId !== null && scopedRunId.length > 0
      ? `/architecture/reviews/${encodeURIComponent(scopedRunId)}?reviewTab=review-package`
      : null;
  const governanceApprovalProvenance = null;
  const showGovernanceApprovalBanner =
    buyerPolishedShell &&
    !loadFailed &&
    !isAssignedToMe &&
    hasGovernanceApprovalProvenance(governanceApprovalProvenance);
  const assignedToMeCount = assignedToMeCountQuery.data ?? rows.length;
  const assignedToMeLoadedFindingCount = useMemo(
    () => countAssignedToMeLoadedFindings(rows),
    [rows],
  );
  const assignedToMeCountMismatch = hasAssignedToMeCountMismatch({
    isAssignedToMe,
    loading,
    loadFailed,
    assignedToMeCountData: assignedToMeCountQuery.data,
    assignedToMeLoadedFindingCount,
  });
  const activeFiltersSummary = useMemo(
    () =>
      deriveGovernanceFindingsActiveFiltersSummary(
        registerFilter,
        jobView,
        nlFacets,
        jobViewFilterActive,
      ),
    [registerFilter, jobView, nlFacets, jobViewFilterActive],
  );
  const assignedToMeStatusBadge = isAssignedToMe ? (
    <GovernanceFindingsAssignedToMeStatusBadge
      assignedToMeCount={assignedToMeCount}
      loading={loading}
      loadFailed={loadFailed}
    />
  ) : null;
  const assignedToMeHeaderActions = isAssignedToMe ? (
    <GovernanceFindingsAssignedToMeHeaderActions
      assignedToMeRefreshing={assignedToMeQuery.refreshing}
      onRefresh={refresh}
    />
  ) : (
    <PageContextualHelpButton />
  );
  const assignedToMeHeaderMetadata = isAssignedToMe ? (
    <GovernanceFindingsAssignedToMeHeaderMetadata
      assignedToMeWorkspaceLabel={assignedToMeWorkspaceLabel}
      assignedToMeCheckedAt={assignedToMeCheckedAt}
      assignedToMeRefreshing={assignedToMeQuery.refreshing}
    />
  ) : undefined;

  return (
    <OperatorPageContainer variant="dashboard">
      {!isAssignedToMe ? (
        <a
          href={`#${GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_FINDINGS_SKIP_LINK_LABEL}
        </a>
      ) : null}

      {showGovernanceApprovalBanner ? (
        <GovernanceApprovalStatusBanner
          className="mb-4"
          onRiskRegisterPage={!isAssignedToMe}
          onAssignedToMeFindingsPage={isAssignedToMe}
          provenance={governanceApprovalProvenance}
        />
      ) : !isAssignedToMe && !buyerPolishedShell ? (
        <LayerHeader pageKey="governance-findings" density="compact" />
      ) : null}

      {!isAssignedToMe ? <FindingsKeyboardTriageCoach /> : null}

      <OperatorPageHeader
        navHref={navHref}
        title={pageTitle}
        subtitle={pageSubtitle}
        titleTestId="architecture-risk-register-page-title"
        breadcrumb={
          isAssignedToMe ? (
            <GovernanceFindingsAssignedToMeBreadcrumb />
          ) : buyerPolishedShell ? (
            <GovernanceFindingsQueueBreadcrumb />
          ) : undefined
        }
        statusBadge={assignedToMeStatusBadge}
        metadata={
          isAssignedToMe ? (
            assignedToMeHeaderMetadata
          ) : !buyerPolishedShell && !loading ? (
            <>
              <SelfDescribingMetricCount
                variant="inline"
                testId="architecture-risk-register-summary-open"
                presentation={governanceRegisterMetricPresentation({
                  count: registerSummary.openRisks,
                  noun: registerSummary.openRisks === 1 ? "open finding" : "open findings",
                  filter: "open",
                  runId: scopedRunId,
                })}
              />
              <SelfDescribingMetricCount
                variant="inline"
                testId="architecture-risk-register-summary-expiring"
                presentation={governanceRegisterMetricPresentation({
                  count: registerSummary.expiringExceptions,
                  noun: registerSummary.expiringExceptions === 1 ? "expiring exception" : "expiring exceptions",
                  filter: "expiring-soon",
                  runId: scopedRunId,
                })}
              />
              <SelfDescribingMetricCount
                variant="inline"
                testId="architecture-risk-register-summary-owner"
                presentation={governanceRegisterMetricPresentation({
                  count: registerSummary.pendingOwner,
                  noun: registerSummary.pendingOwner === 1 ? "pending owner" : "pending owners",
                  filter: "no-owner",
                  runId: scopedRunId,
                })}
              />
              <SelfDescribingMetricCount
                variant="inline"
                testId="architecture-risk-register-summary-overdue"
                presentation={governanceRegisterMetricPresentation({
                  count: registerSummary.overdueReview,
                  noun: registerSummary.overdueReview === 1 ? "overdue review" : "overdue reviews",
                  filter: "overdue-review",
                  runId: scopedRunId,
                })}
              />
            </>
          ) : undefined
        }
        actions={assignedToMeHeaderActions}
      />
      {!isAssignedToMe ? (
        <GovernanceJobRouterStrip currentJobId={currentJobId} layout="default" />
      ) : null}
      {!isAssignedToMe && !buyerPolishedShell ? (
        <>
          <AlertsFindingsVocabularyRail currentSurfaceId="findings-queue" />
          <DecisionRegisterFindingsVocabularyRail currentSurfaceId="findings-queue" />
          <RiskExceptionsFindingsVocabularyRail currentSurfaceId="findings-queue" />
          <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="findings-queue" />
          <PageCapabilityBoundaryStrip surfaceId="governanceFindings" />
        </>
      ) : null}
      <div
        id={!isAssignedToMe ? GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID : undefined}
        className={cn("mt-4 scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
        data-testid="governance-findings-queue-body"
      >
        {secondaryViewPresentation !== null ? (
          <CanonicalObjectSecondaryViewStrip
            presentation={secondaryViewPresentation}
            testId="governance-findings-secondary-view-strip"
            className="mb-1"
          />
        ) : null}

        {scopedRunId ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="governance-findings-run-scope-banner"
          >
            {"Showing findings for review "}
            <span className="font-mono text-al-text-primary">{scopedRunId}</span>
            {" · "}
            <Link className={OPERATOR_LINK.inline} href={navHref}>
              Clear review scope
            </Link>
            {" · "}
            <Link className={OPERATOR_LINK.inline} href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}>
              Open review
            </Link>
            {" · "}
            <Link
              className={OPERATOR_LINK.inline}
              href={
                scopedFindingLifecycleCompareHref ??
                `${comparePageHrefAdaptive("", scopedRunId)}#${COMPARE_FINDING_LIFECYCLE_ANCHOR}`
              }
            >
              Compare with prior review (finding lifecycle)
            </Link>
          </p>
        ) : !isAssignedToMe ? (
          <FindingsQueuePickReviewBeforeTriageStrip
            selectedReviewId=""
            onSelectReview={onPickReviewForTriage}
          />
        ) : null}

        {scopedRunFilterActive && !isAssignedToMe ? (
          <IntegrationConnectChecklist
            title="Triage checklist"
            steps={findingsQueueTriageSteps}
            emphasizedStepId={findingsQueueTriageEmphasizedStepId}
            testIdPrefix="findings-queue-triage"
          />
        ) : null}

        {jobViewFilterActive ? (
          <p
            className={cn("m-0 flex flex-wrap items-center gap-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="governance-findings-job-view-filter-chip"
          >
            <span>
              Filtered by job view: <span className="font-medium text-al-text-primary">{FINDING_JOB_VIEW_LABELS[jobView]}</span>
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => setJobView(DEFAULT_FINDING_JOB_VIEW)}>
              Clear job view filter
            </Button>
          </p>
        ) : null}

        {assignedToMeCountMismatch ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="governance-assigned-to-me-count-reconciliation"
            role="status"
          >
            Header count ({assignedToMeCountQuery.data}) differs from loaded rows ({assignedToMeLoadedFindingCount}).
            Refresh to reconcile.
          </p>
        ) : null}

        {!isAssignedToMe ? (
          <ArchitecturePosturePillarOverview projectId={scopeRecord?.projectId} enabled />
        ) : null}

        {filterBarVisible ? (
          <>
            <GovernanceFindingsFilterBar
              registerFilter={registerFilter}
              onRegisterFilterChange={setRegisterFilter}
              jobView={jobView}
              onJobViewChange={setJobView}
              savedPresets={savedPresets}
              onSaveCurrentFilterAsPreset={saveCurrentFilterAsPreset}
              onRemovePreset={removePreset}
              groupByResource={groupByResource}
              onToggleGroupByResource={toggleGroupByResource}
              displayedRows={displayedRows}
              filterableRows={scopedRows}
              onNaturalLanguageFilterApply={setNlFacets}
            />
            <GovernanceFindingsQueueActiveFilterChips
              registerFilter={registerFilter}
              jobView={jobView}
              nlFacets={nlFacets}
              jobViewFilterActive={jobViewFilterActive}
              onClearAll={clearAllFilters}
            />
          </>
        ) : null}

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading findings…</p>
        ) : null}

        {!loading && rows.length > 0 && displayedRows.length === 0 ? (
          <EnterpriseCompactEmptyState
            {...filterNoMatchPreset}
            description={
              activeFiltersSummary !== null
                ? `${filterNoMatchPreset.description} Active filters: ${activeFiltersSummary}.`
                : filterNoMatchPreset.description
            }
          />
        ) : null}

        {!loading && displayedRows.length > 0 ? (
          <>
            <SponsorStorySynopsisFromCounts
              packageTitle={sponsorSynopsisPackageTitle}
              counts={sponsorSynopsisCounts}
              sponsorHandoffHref={sponsorHandoffHref}
            />
            {scopedRunId !== null && scopedRunId.length > 0 ? (
              <PolicyPackAssignFromReviewStrip
                reviewId={scopedRunId}
                reviewTitle={scopedRunContextQuery.data?.displayTitle ?? null}
              />
            ) : null}
            {continueLastFinding !== null ? (
              <GovernanceFindingsContinueLastViewedRow target={continueLastFinding} />
            ) : null}
            {assignedToMeOldestFindingTarget !== null ? (
              <AssignedToMeContinueOldestFindingStrip
                target={assignedToMeOldestFindingTarget.target}
                href={assignedToMeOldestFindingTarget.href}
              />
            ) : null}
            {firstFindingTriageTarget !== null ? (
              <FindingsTriageFirstFindingStrip
                findingId={firstFindingTriageTarget.findingId}
                findingTitle={firstFindingTriageTarget.findingTitle}
                href={firstFindingTriageTarget.href}
              />
            ) : null}
            <GovernanceFindingsList
              displayedRows={displayedRows}
              buyerPolishedShell={buyerPolishedShell}
              groupByResource={groupByResource}
              queueMode={mode}
              selectedFindingIds={selectedFindingIds}
              onSelectionChange={setSelectedFindingIds}
              onBulkApplied={() => {
                setSelectedFindingIds(new Set());
                refresh();
              }}
            />
          </>
        ) : null}

        {!loading && rows.length === 0 && loadFailed ? (
          <EnterpriseInlineErrorNotification
            testId={loadFailedPreset.testId}
            title={
              !isAssignedToMe && buyerPolishedShell
                ? "Could not load findings for this workspace"
                : loadFailedPreset.title
            }
            description={
              !isAssignedToMe && buyerPolishedShell
                ? "The findings queue did not load. Your existing findings are unchanged — retry the load or check connectivity before navigating away."
                : loadFailedPreset.description
            }
            onRetry={() => {
              void refresh();
            }}
            diagnostics={loadFailure}
            reportProblem={{
              surfaceId: "governance-findings-queue-hard-failure",
              errorTitle: pageTitle,
              errorCode: loadFailure?.errorCode ?? "governance-findings-load-failed",
              correlationId: loadFailure?.correlationId,
              httpStatus: loadFailure?.httpStatus,
            }}
          />
        ) : null}

        {!loading && rows.length === 0 && !loadFailed ? (
          workspaceScopeTeaching !== null ? (
            <WorkspaceScopeEmptyTeaching
              title={workspaceScopeTeaching.title}
              body={workspaceScopeTeaching.body}
              ctaLabel={workspaceScopeTeaching.ctaLabel}
            />
          ) : (
            <EnterpriseCompactEmptyState
              testId="governance-findings-empty-state"
              title={
                isAssignedToMe
                  ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT.title
                  : buyerPolishedShell
                    ? BUYER_RISK_REGISTER_EMPTY_TITLE
                    : ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE
              }
              description={
                isAssignedToMe
                  ? buildGovernanceAssignedToMeEmptyDescription({
                      assigneeDisplayName: currentPrincipal.name ?? "",
                      assigneeRoleLabel: currentPrincipal.primaryAppRole,
                      checkedAt: assignedToMeCheckedAt,
                      fetchBasis: assignedToMeFetchBasis,
                    })
                  : buyerPolishedShell
                    ? BUYER_RISK_REGISTER_EMPTY_BODY
                    : ARCHITECTURE_RISK_REGISTER_EMPTY_BODY
              }
              actions={
                isAssignedToMe
                  ? undefined
                  : [
                      { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
                      {
                        label: buyerPolishedShell ? BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION : "Open resolve outcomes",
                        href: "/governance/approval-queue",
                        variant: "outline",
                      },
                    ]
              }
              footer={
                isAssignedToMe ? (
                  <Button asChild size="sm" variant="primary">
                    <Link href={GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_HREF}>
                      {GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL}
                    </Link>
                  </Button>
                ) : !buyerPolishedShell ? (
                  <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF}>
                    View policy packs
                  </Link>
                ) : undefined
              }
            />
          )
        ) : null}

        {isAssignedToMe ? (
          <GovernanceFindingsRelatedQueuesDisclosure
            capabilitySurfaceId="assignedFindings"
            jobRouterCurrentJobId={currentJobId}
          />
        ) : null}

        {!isAssignedToMe && buyerPolishedShell ? (
          <GovernanceFindingsBuyerChrome scopedRunId={scopedRunId} />
        ) : null}

        {!isAssignedToMe && scopedRunFilterActive && scopedRunId !== null ? (
          <GovernanceFindingsQueueNextReviewFooterClient runId={scopedRunId} />
        ) : null}
      </div>
    </OperatorPageContainer>
  );
}
