"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMemo, useRef } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { RunIdPicker } from "@/components/runs/RunIdPicker";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { useGovernanceDashboardQuery } from "@/hooks/use-governance-dashboard-query";
import { useGovernanceDecisionsNeededSummaryQuery } from "@/hooks/use-governance-decisions-needed-summary-query";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_DEFINITION,
  GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_LABEL,
  GOVERNANCE_OVERVIEW_BLOCKING_AWAITING_EVIDENCE_LABEL,
  GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_BREAKDOWN_HEADING,
  GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_DEFINITION,
  GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_LABEL,
  GOVERNANCE_OVERVIEW_BLOCKING_STALE_LABEL,
  GOVERNANCE_OVERVIEW_BLOCKING_UNOWNED_LABEL,
  GOVERNANCE_OVERVIEW_FINDINGS_ACTION,
  GOVERNANCE_OVERVIEW_IDLE_WORKSPACE_HINT,
  GOVERNANCE_OVERVIEW_LAST_REFRESHED_PREFIX,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_ACTION,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_DISABLED_HINT,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_LEAD,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_TITLE,
  GOVERNANCE_OVERVIEW_METRIC_WINDOW_LABEL,
  GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION,
  GOVERNANCE_OVERVIEW_NO_PENDING_TITLE,
  GOVERNANCE_OVERVIEW_PENDING_ACTION,
  GOVERNANCE_OVERVIEW_PENDING_APPROVALS_DEFINITION,
  GOVERNANCE_OVERVIEW_PENDING_APPROVALS_LABEL,
  GOVERNANCE_OVERVIEW_PENDING_SECTION_TITLE,
  GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_DEFINITION,
  GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_LABEL,
  GOVERNANCE_OVERVIEW_RECENT_DECISIONS_DEFINITION,
  GOVERNANCE_OVERVIEW_RECENT_DECISIONS_LABEL,
  GOVERNANCE_OVERVIEW_RECENT_DECISIONS_SECTION_TITLE,
  GOVERNANCE_OVERVIEW_SUBMIT_ACTION,
  GOVERNANCE_OVERVIEW_SUBMIT_DISABLED_HINT,
  GOVERNANCE_OVERVIEW_SUMMARY_AUTHORITY_LINE,
  GOVERNANCE_OVERVIEW_SUMMARY_HEADING,
  GOVERNANCE_OVERVIEW_SUMMARY_SCOPE_LINE,
} from "@/lib/governance/governance-overview-copy";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import type { GovernanceDashboardSummary } from "@/types/governance-dashboard";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import {
  buildGovernanceOverviewSummaryMetrics,
  type GovernanceOverviewBlockingFindingsBreakdown,
  type GovernanceOverviewSummaryMetrics,
} from "./governance-overview-summary";
import { GovernanceOverviewWorkflowStrip } from "./GovernanceOverviewWorkflowStrip";
import type { FocusSubmitSectionResult } from "./governance-focus-submit-result";

export type GovernanceOverviewPanelProps = {
  readonly buyerPolishedShell: boolean;
  readonly canMutateWorkflow: boolean;
  readonly queryRunId: string;
  readonly setQueryRunId: (value: string) => void;
  readonly onLoadReview: () => void;
  readonly onFocusSubmit: () => FocusSubmitSectionResult;
  readonly onFocusPending: () => void;
  readonly listsLoading: boolean;
};

type OverviewLoadState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly dashboard: GovernanceDashboardSummary;
      readonly metrics: GovernanceOverviewSummaryMetrics;
    }
  | { readonly status: "error"; readonly failure: ApiLoadFailureState };

function summaryMetricAccessibleName(label: string, value: number, destination: string): string {
  return `${label}: ${finiteIntegerCountDisplay(value)}. Go to ${destination}.`;
}

function SummaryMetricCard(props: {
  readonly label: string;
  readonly definition: string;
  readonly value: number;
  readonly href?: string;
  readonly destinationLabel?: string;
  readonly caution?: boolean;
  readonly breakdown?: GovernanceOverviewBlockingFindingsBreakdown;
}): React.JSX.Element {
  const valueClassName = cn(
    "m-0 mt-1 font-semibold tabular-nums text-al-text-primary",
    OPERATOR_TYPOGRAPHY.dataValue,
    props.caution && props.value > 0 ? "text-amber-800 dark:text-amber-200" : null,
  );

  const body = (
    <>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={valueClassName}>{finiteIntegerCountDisplay(props.value)}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
        {GOVERNANCE_OVERVIEW_METRIC_WINDOW_LABEL} · {props.definition}
      </p>
      {props.breakdown !== undefined ? (
        <details className="mt-2">
          <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            {GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_BREAKDOWN_HEADING}
          </summary>
          <ul className={cn("m-0 mt-1 list-none space-y-0.5 p-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            <li>
              {GOVERNANCE_OVERVIEW_BLOCKING_UNOWNED_LABEL}:{" "}
              {finiteIntegerCountDisplay(props.breakdown.unownedHighSeverityFindings)}
            </li>
            <li>
              {GOVERNANCE_OVERVIEW_BLOCKING_STALE_LABEL}: {finiteIntegerCountDisplay(props.breakdown.staleFindings)}
            </li>
            <li>
              {GOVERNANCE_OVERVIEW_BLOCKING_AWAITING_EVIDENCE_LABEL}:{" "}
              {finiteIntegerCountDisplay(props.breakdown.findingsAwaitingEvidence)}
            </li>
          </ul>
        </details>
      ) : null}
    </>
  );

  if (props.href !== undefined && props.destinationLabel !== undefined) {
    return (
      <Link
        className={cn(
          "group rounded-md border border-neutral-200 bg-white px-3 py-3 transition",
          "hover:border-[var(--al-accent-interactive)] hover:bg-al-surface-raised",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2",
          "dark:border-neutral-800 dark:bg-neutral-950/40 dark:hover:border-neutral-700",
        )}
        href={props.href}
        aria-label={summaryMetricAccessibleName(props.label, props.value, props.destinationLabel)}
        data-testid={`governance-overview-metric-link-${props.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">{body}</div>
          <ChevronRight
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-al-text-secondary transition group-hover:text-[var(--al-accent-interactive)]"
          />
        </div>
      </Link>
    );
  }

  return (
    <div
      className="rounded-md border border-dashed border-neutral-200 bg-neutral-50/60 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/20"
      data-testid={`governance-overview-metric-readonly-${props.label.toLowerCase().replace(/\s+/g, "-")}`}
      aria-label={`${props.label}: ${finiteIntegerCountDisplay(props.value)}. Read-only summary count.`}
    >
      {body}
    </div>
  );
}

/** `/governance` landing summary, actions, and review picker before a review is selected. */
export function GovernanceOverviewPanel(props: GovernanceOverviewPanelProps): React.JSX.Element {
  const {
    buyerPolishedShell,
    canMutateWorkflow,
    queryRunId,
    setQueryRunId,
    onLoadReview,
    onFocusSubmit,
    onFocusPending,
    listsLoading,
  } = props;

  const pendingSectionRef = useRef<HTMLElement | null>(null);
  const dashboardQuery = useGovernanceDashboardQuery();
  const decisionsQuery = useGovernanceDecisionsNeededSummaryQuery();
  const submitDisabledReason =
    queryRunId.trim().length === 0 ? whyDisabledIncompleteInput(GOVERNANCE_OVERVIEW_SUBMIT_DISABLED_HINT) : null;

  const loadState = useMemo((): OverviewLoadState => {
    if (dashboardQuery.isPending || decisionsQuery.isPending) {
      return { status: "loading" };
    }

    if (dashboardQuery.isError) {
      return { status: "error", failure: toApiLoadFailure(dashboardQuery.error) };
    }

    if (decisionsQuery.isError) {
      return { status: "error", failure: toApiLoadFailure(decisionsQuery.error) };
    }

    if (dashboardQuery.data === undefined || decisionsQuery.data === undefined) {
      return { status: "loading" };
    }

    return {
      status: "ready",
      dashboard: dashboardQuery.data,
      metrics: buildGovernanceOverviewSummaryMetrics(dashboardQuery.data, decisionsQuery.data),
    };
  }, [
    dashboardQuery.data,
    dashboardQuery.error,
    dashboardQuery.isError,
    dashboardQuery.isPending,
    decisionsQuery.data,
    decisionsQuery.error,
    decisionsQuery.isError,
    decisionsQuery.isPending,
  ]);

  const lastRefreshedAt = useMemo((): Date | null => {
    const dashboardUpdatedAt = dashboardQuery.dataUpdatedAt;
    const decisionsUpdatedAt = decisionsQuery.dataUpdatedAt;
    const timestamps = [dashboardUpdatedAt, decisionsUpdatedAt].filter((value) => value > 0);

    if (timestamps.length === 0) {
      return null;
    }

    return new Date(Math.max(...timestamps));
  }, [dashboardQuery.dataUpdatedAt, decisionsQuery.dataUpdatedAt]);

  const summaryRefreshing = dashboardQuery.isFetching || decisionsQuery.isFetching;

  const retryOverview = (): void => {
    void dashboardQuery.refetch();
    void decisionsQuery.refetch();
  };

  const scrollToPending = (): void => {
    onFocusPending();
    pendingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadReviewDisabled = listsLoading || queryRunId.trim().length === 0;
  const reviewSelected = queryRunId.trim().length > 0;
  const workspaceIsIdle =
    loadState.status === "ready" &&
    loadState.metrics.pendingApprovalRequests === 0 &&
    loadState.metrics.approvedReviewPackages === 0 &&
    loadState.metrics.blockingFindingsTotal === 0 &&
    loadState.metrics.recentDecisions === 0 &&
    loadState.metrics.policyActivations === 0;

  return (
    <div className={cn("mb-8", OPERATOR_LAYOUT.sectionStack)} data-testid="governance-overview-panel">
      <section
        aria-labelledby="governance-overview-load-review-heading"
        className="rounded-md border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/40"
        data-testid="governance-overview-load-review-section"
      >
        <h2 id="governance-overview-load-review-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_LEAD}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <RunIdPicker
            inputId="governance-overview-run"
            label="Review"
            placeholder="Select a review from the list"
            value={queryRunId}
            useBuyerFacingRunLabels={buyerPolishedShell}
            onChange={setQueryRunId}
          />
          <div className="space-y-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              data-testid="governance-overview-load-review"
              disabled={loadReviewDisabled}
              onClick={onLoadReview}
            >
              {listsLoading ? "Loading…" : GOVERNANCE_OVERVIEW_LOAD_REVIEW_ACTION}
            </Button>
            {loadReviewDisabled && !listsLoading ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="governance-overview-load-review-hint">
                {GOVERNANCE_OVERVIEW_LOAD_REVIEW_DISABLED_HINT}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {reviewSelected ? (
      <section aria-labelledby="governance-overview-summary-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="governance-overview-summary-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {GOVERNANCE_OVERVIEW_SUMMARY_HEADING}
            </h2>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {GOVERNANCE_OVERVIEW_SUMMARY_SCOPE_LINE}
            </p>
            <p
              className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="governance-overview-summary-authority"
            >
              {GOVERNANCE_OVERVIEW_SUMMARY_AUTHORITY_LINE}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton
              data-testid="governance-overview-summary-refresh"
              busy={summaryRefreshing}
              onClick={() => void retryOverview()}
            />
            <span
              className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="governance-overview-last-refreshed"
              aria-label={operatorLastRefreshedExactLabel(lastRefreshedAt)}
            >
              {GOVERNANCE_OVERVIEW_LAST_REFRESHED_PREFIX}: {operatorLastRefreshedLabel(lastRefreshedAt)}
            </span>
          </div>
        </div>

        {loadState.status === "loading" ? (
          <div className="mt-3">
            <OperatorLoadingNotice>Loading approval summary…</OperatorLoadingNotice>
          </div>
        ) : null}

        {loadState.status === "error" ? (
          <div className="mt-3" role="alert">
            <OperatorApiProblem
              problem={loadState.failure.problem}
              fallbackMessage={loadState.failure.message}
              correlationId={loadState.failure.correlationId}
            />
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={retryOverview}>
              Retry summary
            </Button>
          </div>
        ) : null}

        {loadState.status === "ready" ? (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_PENDING_APPROVALS_LABEL}
                definition={GOVERNANCE_OVERVIEW_PENDING_APPROVALS_DEFINITION}
                value={loadState.metrics.pendingApprovalRequests}
                href="#governance-overview-pending"
                destinationLabel="pending approvals on this page"
              />
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_LABEL}
                definition={GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_DEFINITION}
                value={loadState.metrics.approvedReviewPackages}
              />
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_LABEL}
                definition={GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_DEFINITION}
                value={loadState.metrics.blockingFindingsTotal}
                href={GOVERNANCE_FINDINGS_PATH}
                destinationLabel="findings queue"
                caution
                breakdown={loadState.metrics.blockingFindings}
              />
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_RECENT_DECISIONS_LABEL}
                definition={GOVERNANCE_OVERVIEW_RECENT_DECISIONS_DEFINITION}
                value={loadState.metrics.recentDecisions}
                href="/governance/decision-register"
                destinationLabel="decision register"
              />
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_LABEL}
                definition={GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_DEFINITION}
                value={loadState.metrics.policyActivations}
                href={GOVERNANCE_POLICY_PACKS_PATH}
                destinationLabel="policy packs"
              />
            </div>

            <GovernanceJobRouterStrip currentJobId="approve-governance" className="mt-4" />

            <div className="mt-4 flex flex-wrap gap-2" data-testid="governance-overview-actions">
              {buyerPolishedShell && !canMutateWorkflow ? (
                <>
                  {loadState.metrics.pendingApprovalRequests > 0 ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      data-testid="governance-overview-pending-action"
                      onClick={scrollToPending}
                    >
                      {GOVERNANCE_OVERVIEW_PENDING_ACTION}
                    </Button>
                  ) : null}
                  <Button asChild variant="outline" size="sm">
                    <Link href={GOVERNANCE_FINDINGS_PATH}>{GOVERNANCE_OVERVIEW_FINDINGS_ACTION}</Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      data-testid="governance-overview-submit-action"
                      disabled={submitDisabledReason !== null}
                      aria-describedby={
                        submitDisabledReason !== null ? "governance-overview-submit-disabled-hint" : undefined
                      }
                      onClick={onFocusSubmit}
                    >
                      {GOVERNANCE_OVERVIEW_SUBMIT_ACTION}
                    </Button>
                    <WhyDisabledCtaHint
                      id="governance-overview-submit-disabled-hint"
                      reason={submitDisabledReason}
                      testId="governance-overview-submit-disabled-hint"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    data-testid="governance-overview-pending-action"
                    onClick={scrollToPending}
                  >
                    {GOVERNANCE_OVERVIEW_PENDING_ACTION}
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={GOVERNANCE_FINDINGS_PATH}>{GOVERNANCE_OVERVIEW_FINDINGS_ACTION}</Link>
                  </Button>
                </>
              )}
            </div>

            {workspaceIsIdle ? (
              <p
                className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="governance-overview-idle-hint"
              >
                {GOVERNANCE_OVERVIEW_IDLE_WORKSPACE_HINT}
              </p>
            ) : null}
          </>
        ) : null}
      </section>
      ) : null}

      {reviewSelected ? <GovernanceOverviewWorkflowStrip /> : null}

      {reviewSelected && loadState.status === "ready" ? (
        <section
          ref={pendingSectionRef}
          id="governance-overview-pending"
          aria-labelledby="governance-overview-pending-heading"
        >
          <h2 id="governance-overview-pending-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {GOVERNANCE_OVERVIEW_PENDING_SECTION_TITLE}
          </h2>
          {loadState.dashboard.pendingApprovals.length === 0 ? (
            <div className="mt-3" data-testid="governance-overview-no-pending">
              <EnterpriseCompactEmptyState
                title={GOVERNANCE_OVERVIEW_NO_PENDING_TITLE}
                description={GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION}
                testId="governance-overview-no-pending-compact"
              />
            </div>
          ) : (
            <ul className="m-0 mt-3 list-none space-y-2 p-0">
              {loadState.dashboard.pendingApprovals.slice(0, 5).map((row) => (
                <li key={row.approvalRequestId}>
                  <Link
                    className={cn(OPERATOR_LINK.nav, "block rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800")}
                    href={`/governance/approval-queue?runId=${encodeURIComponent(row.runId)}`}
                  >
                    <span className="font-medium">{row.manifestVersion}</span>
                    <span className="text-al-text-secondary"> · {row.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {reviewSelected && loadState.status === "ready" && loadState.dashboard.recentDecisions.length > 0 ? (
        <section aria-labelledby="governance-overview-recent-decisions-heading">
          <h2 id="governance-overview-recent-decisions-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {GOVERNANCE_OVERVIEW_RECENT_DECISIONS_SECTION_TITLE}
          </h2>
          <ul className="m-0 mt-3 list-none space-y-2 p-0">
            {loadState.dashboard.recentDecisions.slice(0, 5).map((row) => (
              <li key={row.approvalRequestId}>
                <Link
                  className={cn(OPERATOR_LINK.nav, "block rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800")}
                  href={`/governance/approval-queue?runId=${encodeURIComponent(row.runId)}`}
                >
                  <span className="font-medium">{row.manifestVersion}</span>
                  <span className="text-al-text-secondary"> · {row.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
