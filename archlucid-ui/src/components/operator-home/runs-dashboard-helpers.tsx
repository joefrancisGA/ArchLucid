"use client";

import { StatusTag } from "@/components/ui/status-tag";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import {
  BUYER_ARCHITECTURE_PACKAGE_ORIGIN_CREATED_BADGE,
  BUYER_ARCHITECTURE_PACKAGE_ORIGIN_REVIEWED_BADGE,
  BUYER_RUNS_DASHBOARD_FILTER_ALL,
  BUYER_RUNS_DASHBOARD_TAB_APPROVED,
  BUYER_RUNS_DASHBOARD_TAB_NEEDS_ATTENTION,
  BUYER_RUNS_DASHBOARD_TAB_UNDER_MONITORING,
} from "@/lib/buyer-polish-copy";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import {
  resolveRunSummaryPackageOrigin,
  type ArchitecturePackageOriginToken,
} from "@/lib/architecture-package-origin";
import { OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN } from "@/lib/operator-home-example-request";
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

/** Featured showcase card only when that run is in the active status filter. */
export function resolveShowcaseDemoRunForItems(
  items: readonly RunSummary[],
  showcaseDemoRun: RunSummary | undefined,
): RunSummary | undefined {
  if (showcaseDemoRun === undefined) {
    return undefined;
  }

  const showcaseRunId = showcaseDemoRun.runId;

  if (items.some((run) => run.runId === showcaseRunId)) {
    return showcaseDemoRun;
  }

  return undefined;
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

function packageOriginBadgeLabel(origin: ArchitecturePackageOriginToken): string {
  if (origin === "created") {
    return BUYER_ARCHITECTURE_PACKAGE_ORIGIN_CREATED_BADGE;
  }

  return BUYER_ARCHITECTURE_PACKAGE_ORIGIN_REVIEWED_BADGE;
}

export function ArchitecturePackageOriginBadge(props: {
  readonly run: RunSummary;
  readonly buyerPolishedShell: boolean;
  readonly className?: string;
}) {
  if (!props.buyerPolishedShell) {
    return null;
  }

  const origin = resolveRunSummaryPackageOrigin(props.run);

  if (origin === null) {
    return null;
  }

  return (
    <StatusTag
      kind={origin === "created" ? "ready" : "neutral"}
      label={packageOriginBadgeLabel(origin)}
      className={props.className}
      data-testid={`architecture-package-origin-${origin}`}
    />
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
