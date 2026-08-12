"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { RunIdPicker } from "@/components/runs/RunIdPicker";
import { Button } from "@/components/ui/button";
import { getGovernanceDashboard, getGovernanceDecisionsNeededSummary } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_LABEL,
  GOVERNANCE_OVERVIEW_BLOCKING_ALERTS_LABEL,
  GOVERNANCE_OVERVIEW_IDLE_WORKSPACE_HINT,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_ACTION,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_DISABLED_HINT,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_LEAD,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_TITLE,
  GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION,
  GOVERNANCE_OVERVIEW_NO_PENDING_TITLE,
  GOVERNANCE_OVERVIEW_PENDING_ACTION,
  GOVERNANCE_OVERVIEW_PENDING_APPROVALS_LABEL,
  GOVERNANCE_OVERVIEW_PENDING_SECTION_TITLE,
  GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_LABEL,
  GOVERNANCE_OVERVIEW_RECENT_DECISIONS_LABEL,
  GOVERNANCE_OVERVIEW_RECENT_DECISIONS_SECTION_TITLE,
  GOVERNANCE_OVERVIEW_RISK_REGISTER_ACTION,
  GOVERNANCE_OVERVIEW_SUBMIT_ACTION,
  GOVERNANCE_OVERVIEW_SUMMARY_HEADING,
} from "@/lib/governance/governance-overview-copy";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GovernanceDashboardSummary } from "@/types/governance-dashboard";
import {
  buildGovernanceOverviewSummaryMetrics,
  type GovernanceOverviewSummaryMetrics,
} from "./governance-overview-summary";
import { GovernanceOverviewWorkflowStrip } from "./GovernanceOverviewWorkflowStrip";

export type GovernanceOverviewPanelProps = {
  readonly buyerPolishedShell: boolean;
  readonly canMutateWorkflow: boolean;
  readonly queryRunId: string;
  readonly setQueryRunId: (value: string) => void;
  readonly onLoadReview: () => void;
  readonly onFocusSubmit: () => void;
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

function SummaryMetricCard(props: {
  readonly label: string;
  readonly value: number;
  readonly href?: string;
  readonly caution?: boolean;
}): React.JSX.Element {
  const content = (
    <>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p
        className={cn(
          "m-0 mt-1 font-semibold tabular-nums text-al-text-primary",
          OPERATOR_TYPOGRAPHY.pageTitle,
          props.caution && props.value > 0 ? "text-amber-800 dark:text-amber-200" : null,
        )}
      >
        {finiteIntegerCountDisplay(props.value)}
      </p>
    </>
  );

  if (props.href !== undefined) {
    return (
      <Link
        className="rounded-md border border-neutral-200 bg-white px-3 py-3 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950/40 dark:hover:border-neutral-700"
        href={props.href}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-md border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/40">
      {content}
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
  const [loadState, setLoadState] = useState<OverviewLoadState>({ status: "loading" });

  const loadOverview = useCallback(async (options?: { readonly isCancelled?: () => boolean }): Promise<void> => {
    const isCancelled = options?.isCancelled ?? (() => false);

    if (!isCancelled()) {
      setLoadState({ status: "loading" });
    }

    try {
      const [dashboard, decisionsNeeded] = await Promise.all([
        getGovernanceDashboard(),
        getGovernanceDecisionsNeededSummary(),
      ]);
      const metrics = buildGovernanceOverviewSummaryMetrics(dashboard, decisionsNeeded);

      if (isCancelled()) {
        return;
      }

      setLoadState({
        status: "ready",
        dashboard,
        metrics,
      });
    } catch (error) {
      if (isCancelled()) {
        return;
      }

      setLoadState({ status: "error", failure: toApiLoadFailure(error) });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadOverview({ isCancelled: () => cancelled });

    return () => {
      cancelled = true;
    };
  }, [loadOverview]);

  const scrollToPending = (): void => {
    onFocusPending();
    pendingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadReviewDisabled = listsLoading || queryRunId.trim().length === 0;
  const workspaceIsIdle =
    loadState.status === "ready" &&
    loadState.metrics.pendingApprovalRequests === 0 &&
    loadState.metrics.approvedReviewPackages === 0 &&
    loadState.metrics.blockingGovernanceAlerts === 0 &&
    loadState.metrics.recentDecisions === 0 &&
    loadState.metrics.policyActivations === 0;

  return (
    <div className="mb-8 space-y-6" data-testid="governance-overview-panel">
      <section aria-labelledby="governance-overview-summary-heading">
        <h2 id="governance-overview-summary-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {GOVERNANCE_OVERVIEW_SUMMARY_HEADING}
        </h2>

        {loadState.status === "loading" ? (
          <div className="mt-3">
            <OperatorLoadingNotice>Loading governance summary…</OperatorLoadingNotice>
          </div>
        ) : null}

        {loadState.status === "error" ? (
          <div className="mt-3" role="alert">
            <OperatorApiProblem
              problem={loadState.failure.problem}
              fallbackMessage={loadState.failure.message}
              correlationId={loadState.failure.correlationId}
            />
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void loadOverview()}>
              Retry summary
            </Button>
          </div>
        ) : null}

        {loadState.status === "ready" ? (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_PENDING_APPROVALS_LABEL}
                value={loadState.metrics.pendingApprovalRequests}
                href="#governance-overview-pending"
              />
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_LABEL}
                value={loadState.metrics.approvedReviewPackages}
              />
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_BLOCKING_ALERTS_LABEL}
                value={loadState.metrics.blockingGovernanceAlerts}
                href="/governance/findings"
                caution
              />
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_RECENT_DECISIONS_LABEL}
                value={loadState.metrics.recentDecisions}
                href="/governance/decision-register"
              />
              <SummaryMetricCard
                label={GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_LABEL}
                value={loadState.metrics.policyActivations}
                href={GOVERNANCE_POLICY_PACKS_PATH}
              />
            </div>

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
                    <Link href="/governance/findings">{GOVERNANCE_OVERVIEW_RISK_REGISTER_ACTION}</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="primary" size="sm" data-testid="governance-overview-submit-action" onClick={onFocusSubmit}>
                    {GOVERNANCE_OVERVIEW_SUBMIT_ACTION}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" data-testid="governance-overview-pending-action" onClick={scrollToPending}>
                    {GOVERNANCE_OVERVIEW_PENDING_ACTION}
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/governance/findings">{GOVERNANCE_OVERVIEW_RISK_REGISTER_ACTION}</Link>
                  </Button>
                </>
              )}
            </div>

            {workspaceIsIdle ? (
              <p
                className={cn("m-0 mt-4 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="governance-overview-idle-hint"
              >
                {GOVERNANCE_OVERVIEW_IDLE_WORKSPACE_HINT}
              </p>
            ) : null}
          </>
        ) : null}
      </section>

      <GovernanceOverviewWorkflowStrip />

      <section
        aria-labelledby="governance-overview-load-review-heading"
        className="rounded-md border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/40"
        data-testid="governance-overview-load-review-section"
      >
        <h2 id="governance-overview-load-review-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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

      {loadState.status === "ready" ? (
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

      {loadState.status === "ready" && loadState.dashboard.recentDecisions.length > 0 ? (
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
