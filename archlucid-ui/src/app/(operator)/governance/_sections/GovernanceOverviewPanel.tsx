"use client";

import { cn } from "@/lib/utils";
import { useRef } from "react";

import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_OVERVIEW_SUBMIT_DISABLED_HINT } from "@/lib/governance/governance-overview-copy";
import { governanceApprovalQueueHref } from "@/lib/governance/governance-route-paths";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";

import type { FocusSubmitSectionResult } from "./governance-focus-submit-result";
import { GovernanceOverviewLoadReviewSection } from "./GovernanceOverviewLoadReviewSection";
import { GovernanceOverviewListsPanelShell } from "./GovernanceOverviewListsPanelShell";
import { GovernanceOverviewSummaryPanelShell } from "./GovernanceOverviewSummaryPanelShell";
import { GovernanceOverviewWorkflowStrip } from "./GovernanceOverviewWorkflowStrip";
import { useGovernanceOverviewLoadState } from "./use-governance-overview-load-state";

export type GovernanceOverviewPanelProps = {
  readonly buyerPolishedShell: boolean;
  readonly canMutateWorkflow: boolean;
  readonly queryRunId: string;
  readonly setQueryRunId: (value: string) => void;
  readonly onLoadReview: () => void;
  readonly onFocusSubmit: () => FocusSubmitSectionResult;
  readonly onFocusPending: () => void;
  readonly listsLoading: boolean;
  readonly hubScopedRunId?: string;
};

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
    hubScopedRunId = "",
  } = props;

  const hubScopedRunIdTrimmed = hubScopedRunId.trim();
  const hubScopedRunFilterActive = hubScopedRunIdTrimmed.length > 0;
  const overviewClearScopeHref = governanceApprovalQueueHref(null);

  const pendingSectionRef = useRef<HTMLElement | null>(null);
  const { loadState, lastRefreshedAt, summaryRefreshing, retryOverview, workspaceIsIdle } =
    useGovernanceOverviewLoadState();

  const submitDisabledReason =
    queryRunId.trim().length === 0 ? whyDisabledIncompleteInput(GOVERNANCE_OVERVIEW_SUBMIT_DISABLED_HINT) : null;

  const scrollToPending = (): void => {
    onFocusPending();
    pendingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const reviewSelected = queryRunId.trim().length > 0;

  return (
    <div className={cn("mb-8", OPERATOR_LAYOUT.sectionStack)} data-testid="governance-overview-panel">
      <GovernanceOverviewLoadReviewSection
        buyerPolishedShell={buyerPolishedShell}
        queryRunId={queryRunId}
        setQueryRunId={setQueryRunId}
        onLoadReview={onLoadReview}
        listsLoading={listsLoading}
        hubScopedRunIdTrimmed={hubScopedRunIdTrimmed}
        hubScopedRunFilterActive={hubScopedRunFilterActive}
        overviewClearScopeHref={overviewClearScopeHref}
      />

      {reviewSelected ? (
        <GovernanceOverviewSummaryPanelShell
          buyerPolishedShell={buyerPolishedShell}
          canMutateWorkflow={canMutateWorkflow}
          submitDisabledReason={submitDisabledReason}
          onFocusSubmit={onFocusSubmit}
          onFocusPending={scrollToPending}
          loadState={loadState}
          lastRefreshedAt={lastRefreshedAt}
          summaryRefreshing={summaryRefreshing}
          retryOverview={retryOverview}
          workspaceIsIdle={workspaceIsIdle}
        />
      ) : null}

      {reviewSelected ? <GovernanceOverviewWorkflowStrip /> : null}

      {reviewSelected && loadState.status === "ready" ? (
        <GovernanceOverviewListsPanelShell pendingSectionRef={pendingSectionRef} loadState={loadState} />
      ) : null}
    </div>
  );
}
