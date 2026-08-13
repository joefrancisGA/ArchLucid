"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { AlertsFindingsVocabularyRail } from "@/components/AlertsFindingsVocabularyRail";
import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import { GovernanceApprovalStatusBanner } from "@/components/governance/GovernanceApprovalStatusBanner";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { EnterpriseInlineErrorNotification } from "@/components/EnterpriseInlineErrorNotification";
import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/findings/FindingsQueueSearchEvidenceVocabularyRail";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { GovernanceFindingsRelatedQueuesDisclosure } from "@/components/governance/findings/GovernanceFindingsRelatedQueuesDisclosure";
import { RiskExceptionsFindingsVocabularyRail } from "@/components/RiskExceptionsFindingsVocabularyRail";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { GovernanceFindingsFilterBar } from "@/components/governance/findings/GovernanceFindingsFilterBar";
import { GovernanceFindingsList } from "@/components/governance/findings/GovernanceFindingsList";
import { SponsorStorySynopsisFromCounts } from "@/components/operator/SponsorStorySynopsisPanel";
import { Button } from "@/components/ui/button";
import { useGovernanceFindingsFilter } from "@/components/governance/findings/use-governance-findings-filter";
import { useGovernanceFindingsQuery } from "@/components/governance/findings/use-governance-findings-query";
import { useAssignedToMeFindingsQuery } from "@/components/governance/findings/use-assigned-to-me-findings-query";
import {
  ARCHITECTURE_RISK_REGISTER_EMPTY_BODY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_TITLE,
  ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF,
  computeArchitectureRiskRegisterSummary,
  matchesGovernanceFindingsRunScope,
  matchesRiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
import {
  BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD,
  BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE,
  BUYER_RISK_REGISTER_EMPTY_BODY,
  BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION,
  BUYER_RISK_REGISTER_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_FILTER_NO_MATCH_COMPACT,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_LOAD_FAILED_COMPACT,
  GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT,
  GOVERNANCE_FINDINGS_LOAD_FAILED_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { COMPARE_FINDING_LIFECYCLE_ANCHOR } from "@/lib/compare-finding-lifecycle";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import type { GovernanceJobId } from "@/lib/governance/governance-job-router";
import { governanceRegisterMetricPresentation } from "@/lib/metric-count-presentation";
import { buildSponsorStoryDispositionCountsFromRows } from "@/lib/sponsor-story-synopsis";
import {
  matchesFindingsNaturalLanguageFacets,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings/findings-natural-language-filter";
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
  filterGovernanceRowsForJobView,
  FINDING_JOB_VIEW_LABELS,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { resolveEffectiveFindingJobView } from "@/lib/findings/finding-job-view";

export type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

export type GovernanceFindingsQueueMode = "tenant" | "assigned-to-me";

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
    () => readGovernanceFindingsQueueFacets().jobView,
  );
  const [nlFacets, setNlFacetsState] = useState<FindingsNaturalLanguageFacets>(
    () => readGovernanceFindingsQueueFacets().nlFacets,
  );
  const isAssignedToMe = mode === "assigned-to-me";
  const tenantQuery = useGovernanceFindingsQuery(!isAssignedToMe);
  const assignedToMeQuery = useAssignedToMeFindingsQuery(isAssignedToMe);
  const activeQuery = isAssignedToMe ? assignedToMeQuery : tenantQuery;
  const { rows, loading, loadFailed, refresh } = activeQuery;
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
  } = useGovernanceFindingsFilter();

  const setJobView = useCallback((next: FindingJobView): void => {
    setJobViewState(next);
    patchGovernanceFindingsQueueFacets({ jobView: next });
  }, []);

  const setNlFacets = useCallback((next: FindingsNaturalLanguageFacets): void => {
    setNlFacetsState(next);
    patchGovernanceFindingsQueueFacets({ nlFacets: next });
  }, []);

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const filterBarVisible = !buyerPolishedShell && !loading && rows.length > 0;
  const effectiveJobView = resolveEffectiveFindingJobView(jobView, filterBarVisible);
  const jobViewFilterActive = filterBarVisible && jobView !== DEFAULT_FINDING_JOB_VIEW;
  const scopedRows = useMemo(
    () => rows.filter((row) => matchesGovernanceFindingsRunScope(row, scopedRunId)),
    [rows, scopedRunId],
  );
  const displayedRows = useMemo(() => {
    const facetFilteredRows = scopedRows.filter(
      (row) =>
        matchesRiskRegisterFilter(row, registerFilter) &&
        matchesFindingsNaturalLanguageFacets(
          {
            title: row.title,
            severity: row.severity,
            status: row.status,
            latestDisposition: row.latestDisposition,
          },
          nlFacets,
        ),
    );

    if (effectiveJobView === null) {
      return facetFilteredRows;
    }

    return filterGovernanceRowsForJobView(facetFilteredRows, effectiveJobView);
  }, [scopedRows, registerFilter, effectiveJobView, nlFacets]);
  const registerSummary = useMemo(() => computeArchitectureRiskRegisterSummary(rows), [rows]);
  const findingIds = useMemo(
    () => displayedRows.filter((row) => row.recordKind === "finding").map((row) => row.findingId),
    [displayedRows],
  );
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
  const currentJobId: GovernanceJobId = isAssignedToMe ? "assigned-to-me-findings" : "triage-findings";
  const loadFailedPreset = isAssignedToMe
    ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_LOAD_FAILED_COMPACT
    : GOVERNANCE_FINDINGS_LOAD_FAILED_COMPACT;
  const filterNoMatchPreset = isAssignedToMe
    ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_FILTER_NO_MATCH_COMPACT
    : GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT;
  const secondaryViewPresentation =
    displayedRows.length > 0 ? secondaryViewFromGovernanceQueueRow(displayedRows[0]) : null;
  const sponsorSynopsisPackageTitle =
    displayedRows.find((row) => row.recordKind === "finding")?.runLabel ??
    (scopedRunId !== null && scopedRunId.length > 0 ? scopedRunId : "this workspace");
  const sponsorSynopsisCounts = useMemo(
    () => buildSponsorStoryDispositionCountsFromRows(displayedRows.filter((row) => row.recordKind === "finding")),
    [displayedRows],
  );
  const sponsorHandoffHref =
    scopedRunId !== null && scopedRunId.length > 0
      ? `/architecture/reviews/${encodeURIComponent(scopedRunId)}?reviewTab=review-package`
      : null;

  return (
    <div className="w-full max-w-[1440px]">
      {buyerPolishedShell && !loadFailed ? (
        <GovernanceApprovalStatusBanner
          className="mb-4"
          onRiskRegisterPage={!isAssignedToMe}
          onAssignedToMeFindingsPage={isAssignedToMe}
        />
      ) : (
        <LayerHeader pageKey="governance-findings" density="compact" />
      )}

      <OperatorPageHeader
        navHref={navHref}
        title={pageTitle}
        subtitle={pageSubtitle}
        titleTestId="architecture-risk-register-page-title"
        metadata={
          !buyerPolishedShell && !loading && !isAssignedToMe ? (
            <>
              <SelfDescribingMetricCount
                variant="inline"
                testId="architecture-risk-register-summary-open"
                presentation={governanceRegisterMetricPresentation({
                  count: registerSummary.openRisks,
                  noun: registerSummary.openRisks === 1 ? "open risk" : "open risks",
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
        actions={<PageContextualHelpButton />}
      />
      <GovernanceJobRouterStrip currentJobId={currentJobId} />
      {isAssignedToMe ? (
        <GovernanceFindingsRelatedQueuesDisclosure capabilitySurfaceId="assignedFindings" />
      ) : (
        <>
          <AlertsFindingsVocabularyRail currentSurfaceId="findings-queue" />
          <DecisionRegisterFindingsVocabularyRail currentSurfaceId="findings-queue" />
          <RiskExceptionsFindingsVocabularyRail currentSurfaceId="findings-queue" />
          <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="findings-queue" />
          <PageCapabilityBoundaryStrip surfaceId="governanceFindings" />
        </>
      )}
      <div className={cn("mt-4", OPERATOR_LAYOUT.sectionStack)}>
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
            {isAssignedToMe ? "Showing findings for review " : "Showing risks for review "}
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
              href={`${comparePageHrefAdaptive("", scopedRunId)}#${COMPARE_FINDING_LIFECYCLE_ANCHOR}`}
            >
              Compare with prior review (finding lifecycle)
            </Link>
          </p>
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

        {filterBarVisible ? (
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
        ) : null}

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading findings…</p>
        ) : null}

        {!loading && rows.length > 0 && displayedRows.length === 0 ? (
          <EnterpriseCompactEmptyState {...filterNoMatchPreset} />
        ) : null}

        {!loading && displayedRows.length > 0 ? (
          <>
            <SponsorStorySynopsisFromCounts
              packageTitle={sponsorSynopsisPackageTitle}
              counts={sponsorSynopsisCounts}
              sponsorHandoffHref={sponsorHandoffHref}
            />
            <GovernanceFindingsList
              displayedRows={displayedRows}
              buyerPolishedShell={buyerPolishedShell}
              groupByResource={groupByResource}
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
                ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT.description
                : buyerPolishedShell
                  ? BUYER_RISK_REGISTER_EMPTY_BODY
                  : ARCHITECTURE_RISK_REGISTER_EMPTY_BODY
            }
            actions={
              isAssignedToMe
                ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT.actions
                : [
                    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
                    {
                      label: buyerPolishedShell ? BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION : "Open governance workflow",
                      href: "/governance/approval-queue",
                      variant: "outline",
                    },
                  ]
            }
            footer={
              !buyerPolishedShell && !isAssignedToMe ? (
                <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF}>
                  View policy packs
                </Link>
              ) : undefined
            }
          />
        ) : null}
      </div>
    </div>
  );
}
