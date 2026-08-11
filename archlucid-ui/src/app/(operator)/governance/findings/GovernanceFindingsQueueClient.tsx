"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { AlertsFindingsVocabularyRail } from "@/components/AlertsFindingsVocabularyRail";
import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import { GovernanceApprovalStatusBanner } from "@/components/governance/GovernanceApprovalStatusBanner";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/FindingsQueueSearchEvidenceVocabularyRail";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { GovernanceJobRouterStrip } from "@/components/GovernanceJobRouterStrip";
import { RiskExceptionsFindingsVocabularyRail } from "@/components/RiskExceptionsFindingsVocabularyRail";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { GovernanceFindingsFilterBar } from "@/components/governance/findings/GovernanceFindingsFilterBar";
import { GovernanceFindingsList } from "@/components/governance/findings/GovernanceFindingsList";
import { SponsorStorySynopsisFromCounts } from "@/components/operator/SponsorStorySynopsisPanel";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { useGovernanceFindingsFilter } from "@/components/governance/findings/use-governance-findings-filter";
import { useGovernanceFindingsQuery } from "@/components/governance/findings/use-governance-findings-query";
import {
  ARCHITECTURE_RISK_REGISTER_EMPTY_BODY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_TITLE,
  ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF,
  computeArchitectureRiskRegisterSummary,
  matchesGovernanceFindingsRunScope,
  matchesRiskRegisterFilter,
} from "@/lib/architecture-risk-register-page";
import {
  BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD,
  BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE,
  BUYER_RISK_REGISTER_EMPTY_BODY,
  BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION,
  BUYER_RISK_REGISTER_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { governanceRegisterMetricPresentation } from "@/lib/metric-count-presentation";
import { buildSponsorStoryDispositionCountsFromRows } from "@/lib/sponsor-story-synopsis";
import {
  matchesFindingsNaturalLanguageFacets,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings-natural-language-filter";
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { secondaryViewFromGovernanceQueueRow } from "@/lib/canonical-object-home-registry";
import {
  patchGovernanceFindingsQueueFacets,
  readGovernanceFindingsQueueFacets,
} from "@/lib/governance-findings-queue-facets-storage";
import { usePrefetchItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";
import { cn } from "@/lib/utils";
import {
  filterGovernanceRowsForJobView,
  type FindingJobView,
} from "@/lib/finding-job-view";

export type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

/**
 * Findings hub: cross-run queue from explainability aggregates, plus a deterministic PHI sample row in public demo mode.
 */
export default function GovernanceFindingsQueueClient() {
  const [selectedFindingIds, setSelectedFindingIds] = useState<ReadonlySet<string>>(new Set());
  const [jobView, setJobViewState] = useState<FindingJobView>(
    () => readGovernanceFindingsQueueFacets().jobView,
  );
  const [nlFacets, setNlFacetsState] = useState<FindingsNaturalLanguageFacets>(
    () => readGovernanceFindingsQueueFacets().nlFacets,
  );
  const { rows, loading, loadFailed, refresh } = useGovernanceFindingsQuery();
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
  const scopedRows = useMemo(
    () => rows.filter((row) => matchesGovernanceFindingsRunScope(row, scopedRunId)),
    [rows, scopedRunId],
  );
  const displayedRows = useMemo(
    () =>
      filterGovernanceRowsForJobView(
        scopedRows.filter(
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
        ),
        jobView,
      ),
    [scopedRows, registerFilter, jobView, nlFacets],
  );
  const registerSummary = useMemo(() => computeArchitectureRiskRegisterSummary(rows), [rows]);
  const findingIds = useMemo(
    () => displayedRows.filter((row) => row.recordKind === "finding").map((row) => row.findingId),
    [displayedRows],
  );
  usePrefetchItsmFindingCorrelations(findingIds);
  const pageTitle = buyerPolishedShell ? BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE : ARCHITECTURE_RISK_REGISTER_PAGE_TITLE;
  const pageSubtitle = buyerPolishedShell
    ? BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD
    : ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE;
  const secondaryViewPresentation =
    displayedRows.length > 0 ? secondaryViewFromGovernanceQueueRow(displayedRows[0]) : null;
  const sponsorSynopsisPackageTitle =
    displayedRows.find((row) => row.recordKind === "finding")?.runLabel ??
    (scopedRunId !== null && scopedRunId.length > 0 ? scopedRunId : "this review");
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
      {buyerPolishedShell ? (
        <GovernanceApprovalStatusBanner className="mb-4" onRiskRegisterPage />
      ) : (
        <LayerHeader pageKey="governance-findings" density="compact" />
      )}

      <OperatorPageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        titleTestId="architecture-risk-register-page-title"
        metadata={
          !buyerPolishedShell && !loading ? (
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
      <GovernanceJobRouterStrip currentJobId="triage-findings" />
      <AlertsFindingsVocabularyRail currentSurfaceId="findings-queue" />
      <DecisionRegisterFindingsVocabularyRail currentSurfaceId="findings-queue" />
      <RiskExceptionsFindingsVocabularyRail currentSurfaceId="findings-queue" />
      <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="findings-queue" />
      <PageCapabilityBoundaryStrip surfaceId="governanceFindings" />
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
            Showing risks for review{" "}
            <span className="font-mono text-al-text-primary">{scopedRunId}</span>
            {" Â· "}
            <Link className={OPERATOR_LINK.inline} href="/governance/findings">
              Clear review scope
            </Link>
            {" Â· "}
            <Link className={OPERATOR_LINK.inline} href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}>
              Open review
            </Link>
          </p>
        ) : null}

        {!buyerPolishedShell && !loading && rows.length > 0 ? (
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
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading findingsâ€¦</p>
        ) : null}

        {!loading && rows.length > 0 && displayedRows.length === 0 ? (
          <EnterpriseCompactEmptyState {...GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT} />
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

        {!loading && rows.length === 0 ? (
          <>
            <EnterpriseCompactEmptyState
              testId="governance-findings-empty-state"
              title={buyerPolishedShell ? BUYER_RISK_REGISTER_EMPTY_TITLE : ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE}
              description={
                loadFailed
                  ? buyerPolishedShell
                    ? "We could not load risks for this review. Check your connection, or open reviews and try again."
                    : "We could not load the architecture risk register for this workspace â€” check connectivity, then open the curated Claims Intake example if you are in demo mode."
                  : buyerPolishedShell
                    ? BUYER_RISK_REGISTER_EMPTY_BODY
                    : ARCHITECTURE_RISK_REGISTER_EMPTY_BODY
              }
              actions={[
                { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
                {
                  label: buyerPolishedShell ? BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION : "Open governance workflow",
                  href: "/governance/approval-queue",
                  variant: "outline",
                },
              ]}
              footer={
                !buyerPolishedShell ? (
                  <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF}>
                    View policy packs
                  </Link>
                ) : undefined
              }
            />
            {loadFailed ? (
              <FatalPageReportProblemSupportRow
                surfaceId="governance-findings-queue-hard-failure"
                errorTitle={pageTitle}
                errorCode="governance-findings-load-failed"
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

