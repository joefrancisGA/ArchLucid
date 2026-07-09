"use client";

import { RunStatusBadge } from "@/components/RunStatusBadge";
import { StatusTag } from "@/components/ui/status-tag";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import {
  BUYER_RUNS_DASHBOARD_FILTER_ALL,
  BUYER_RUNS_DASHBOARD_TAB_APPROVED,
  BUYER_RUNS_DASHBOARD_TAB_NEEDS_ATTENTION,
  BUYER_RUNS_DASHBOARD_TAB_UNDER_MONITORING,
} from "@/lib/buyer-polish-copy";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { BUYER_GOVERNANCE_MONITORING_BADGE } from "@/lib/buyer-home-status-copy";
import { OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN } from "@/lib/operator-home-example-request";
import { resolveRunFindingCountDisplay } from "@/lib/operator-home-run-list-insight";
import { SHOWCASE_BUYER_REVIEW_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";

export function runListPrimaryTitle(run: RunSummary): string {
  if (isShowcaseStaticDemoRunId(run.runId ?? "")) {
    return SHOWCASE_BUYER_REVIEW_TITLE;
  }

  const d = run.description?.trim() ?? "";

  if (d.length > 0) {
    return d;
  }

  return buyerFacingReviewTitleFromSummary(run);
}

export function isRunNeedingAttention(run: RunSummary): boolean {
  return run.hasFindingsSnapshot === true && run.hasGoldenManifest !== true;
}

export function isRunApprovedPackage(run: RunSummary): boolean {
  return run.hasGoldenManifest === true && run.hasGovernanceWarnings !== true;
}

export function isRunApprovedWithMonitoringPackage(run: RunSummary): boolean {
  return run.hasGoldenManifest === true && run.hasGovernanceWarnings === true;
}

export function runsDashboardTabLabel(tabId: RunsDashboardTabId, buyerPolishedShell: boolean): string {
  if (buyerPolishedShell) {
    if (tabId === "all") {
      return BUYER_RUNS_DASHBOARD_FILTER_ALL;
    }

    if (tabId === "approved") {
      return BUYER_RUNS_DASHBOARD_TAB_APPROVED;
    }

    if (tabId === "attention") {
      return BUYER_RUNS_DASHBOARD_TAB_NEEDS_ATTENTION;
    }

    return BUYER_RUNS_DASHBOARD_TAB_UNDER_MONITORING;
  }

  if (tabId === "all") {
    return RUNS_DASHBOARD_LABELS.tabRecent;
  }

  if (tabId === "approved") {
    return BUYER_RUNS_DASHBOARD_TAB_APPROVED;
  }

  if (tabId === "attention") {
    return RUNS_DASHBOARD_LABELS.tabNeedsAttention;
  }

  return RUNS_DASHBOARD_LABELS.tabOutcomes;
}

export function RunGovernanceWarningIndicator(props: { readonly buyerPolishedShell: boolean }) {
  const title = props.buyerPolishedShell
    ? BUYER_GOVERNANCE_MONITORING_BADGE
    : RUNS_DASHBOARD_LABELS.governanceWarningTitle;

  return (
    <StatusTag
      kind={props.buyerPolishedShell ? "approved-with-monitoring" : "needs-attention"}
      label={title}
      data-testid="run-governance-warning-indicator"
    />
  );
}

export function RunListRowBadges(props: { readonly run: RunSummary; readonly className?: string }) {
  const findingCount = resolveRunFindingCountDisplay(props.run);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <RunStatusBadge run={props.run} className={props.className} />
      {findingCount !== null ? (
        <StatusTag
          kind={props.run.hasGoldenManifest === true ? "ready" : "needs-attention"}
          label={`${findingCount} finding${findingCount === 1 ? "" : "s"}`}
          className="text-[0.6rem]"
        />
      ) : null}
      {props.run.hasGovernanceWarnings === true ? (
        <RunGovernanceWarningIndicator buyerPolishedShell={isBuyerPolishedOperatorShellEnv()} />
      ) : null}
    </div>
  );
}

export function runSummaryHasArchivedField(run: RunSummary): boolean {
  return run.isArchived !== undefined && run.isArchived !== null;
}

export function runListPrimaryRequestId(run: RunSummary): string | null {
  const id = run.requestId?.trim() ?? "";

  if (id.length > 0) {
    return id;
  }

  return null;
}

export function runIsShowcaseHomeExampleStory(run: RunSummary): boolean {
  const id = run.runId.trim();

  if (id === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return true;
  }

  return (run.description ?? "")
    .toLowerCase()
    .includes(OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN.toLowerCase());
}
