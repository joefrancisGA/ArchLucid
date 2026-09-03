"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_DEFINITION,
  GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_LABEL,
  GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_DEFINITION,
  GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_LABEL,
  GOVERNANCE_OVERVIEW_FINDINGS_ACTION,
  GOVERNANCE_OVERVIEW_IDLE_WORKSPACE_HINT,
  GOVERNANCE_OVERVIEW_LAST_REFRESHED_PREFIX,
  GOVERNANCE_OVERVIEW_PENDING_ACTION,
  GOVERNANCE_OVERVIEW_PENDING_APPROVALS_DEFINITION,
  GOVERNANCE_OVERVIEW_PENDING_APPROVALS_LABEL,
  GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_DEFINITION,
  GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_LABEL,
  GOVERNANCE_OVERVIEW_RECENT_DECISIONS_DEFINITION,
  GOVERNANCE_OVERVIEW_RECENT_DECISIONS_LABEL,
  GOVERNANCE_OVERVIEW_SUBMIT_ACTION,
  GOVERNANCE_OVERVIEW_SUMMARY_AUTHORITY_LINE,
  GOVERNANCE_OVERVIEW_SUMMARY_HEADING,
  GOVERNANCE_OVERVIEW_SUMMARY_SCOPE_LINE,
} from "@/lib/governance/governance-overview-copy";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";

import { GovernanceOverviewSummaryMetricCard } from "./GovernanceOverviewSummaryMetricCard";
import type { useGovernanceOverviewLoadState } from "./use-governance-overview-load-state";

export type GovernanceOverviewSummaryPanelShellProps = {
  readonly buyerPolishedShell: boolean;
  readonly canMutateWorkflow: boolean;
  readonly submitDisabledReason: string | null;
  readonly onFocusSubmit: () => void;
  readonly onFocusPending: () => void;
  readonly loadState: ReturnType<typeof useGovernanceOverviewLoadState>["loadState"];
  readonly lastRefreshedAt: ReturnType<typeof useGovernanceOverviewLoadState>["lastRefreshedAt"];
  readonly summaryRefreshing: ReturnType<typeof useGovernanceOverviewLoadState>["summaryRefreshing"];
  readonly retryOverview: ReturnType<typeof useGovernanceOverviewLoadState>["retryOverview"];
  readonly workspaceIsIdle: ReturnType<typeof useGovernanceOverviewLoadState>["workspaceIsIdle"];
};

export function GovernanceOverviewSummaryPanelShell(
  props: GovernanceOverviewSummaryPanelShellProps,
): React.JSX.Element {
  const {
    buyerPolishedShell,
    canMutateWorkflow,
    submitDisabledReason,
    onFocusSubmit,
    onFocusPending,
    loadState,
    lastRefreshedAt,
    summaryRefreshing,
    retryOverview,
    workspaceIsIdle,
  } = props;

  return (
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
            <GovernanceOverviewSummaryMetricCard
              label={GOVERNANCE_OVERVIEW_PENDING_APPROVALS_LABEL}
              definition={GOVERNANCE_OVERVIEW_PENDING_APPROVALS_DEFINITION}
              value={loadState.metrics.pendingApprovalRequests}
              href="#governance-overview-pending"
              destinationLabel="pending approvals on this page"
            />
            <GovernanceOverviewSummaryMetricCard
              label={GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_LABEL}
              definition={GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_DEFINITION}
              value={loadState.metrics.approvedReviewPackages}
            />
            <GovernanceOverviewSummaryMetricCard
              label={GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_LABEL}
              definition={GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_DEFINITION}
              value={loadState.metrics.blockingFindingsTotal}
              href={GOVERNANCE_FINDINGS_PATH}
              destinationLabel="findings queue"
              caution
              breakdown={loadState.metrics.blockingFindings}
            />
            <GovernanceOverviewSummaryMetricCard
              label={GOVERNANCE_OVERVIEW_RECENT_DECISIONS_LABEL}
              definition={GOVERNANCE_OVERVIEW_RECENT_DECISIONS_DEFINITION}
              value={loadState.metrics.recentDecisions}
              href="/governance/decision-register"
              destinationLabel="decision register"
            />
            <GovernanceOverviewSummaryMetricCard
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
                    onClick={onFocusPending}
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
                  onClick={onFocusPending}
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
  );
}
