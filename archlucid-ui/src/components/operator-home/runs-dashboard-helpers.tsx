"use client";

import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import { StatusTag } from "@/components/ui/status-tag";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { toReviewListDisplayTitle } from "@/lib/review-display-title";
import {
  BUYER_ARCHITECTURE_PACKAGE_ORIGIN_CREATED_BADGE,
  BUYER_ARCHITECTURE_PACKAGE_ORIGIN_METADATA_LABEL,
  BUYER_ARCHITECTURE_PACKAGE_ORIGIN_REVIEWED_BADGE,
  BUYER_ARCHITECTURE_PACKAGE_ORIGIN_REVIEWED_DISCLOSURE,
  BUYER_RUNS_DASHBOARD_FILTER_ALL,
  BUYER_RUNS_DASHBOARD_TAB_APPROVED,
  BUYER_RUNS_DASHBOARD_TAB_NEEDS_ATTENTION,
  BUYER_RUNS_DASHBOARD_TAB_UNDER_MONITORING,
} from "@/lib/buyer/buyer-polish-copy";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import {
  resolveRunSummaryPackageOrigin,
  type ArchitecturePackageOriginToken,
} from "@/lib/architecture/architecture-package-origin";
import { OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN } from "@/lib/operator/operator-home-example-request";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { GovernanceReviewAwaitingActionItem } from "@/lib/api/governance-stickiness-api";
import type { RunSummary } from "@/types/authority";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";

export function runListPrimaryTitle(run: RunSummary): string {
  const title = buyerFacingReviewTitleFromSummary(run);

  return title.length > 0 ? toReviewListDisplayTitle(title) : title;
}

export function filterRunsAwaitingApproval(
  items: readonly RunSummary[],
  awaitingApprovalRunIds: readonly string[],
): RunSummary[] {
  if (awaitingApprovalRunIds.length === 0) {
    return [];
  }

  const awaitingIds = new Set(awaitingApprovalRunIds);

  return items.filter((run) => {
    const runId = run.runId?.trim() ?? "";

    return runId.length > 0 && awaitingIds.has(runId);
  });
}

/** Minimal list row when the governance queue has a run outside the home preview snapshot. */
export function runSummaryFromGovernanceAwaitingActionItem(
  item: GovernanceReviewAwaitingActionItem,
  projectId: string,
): RunSummary {
  const executedUtc = item.executedUtc?.trim() ?? "";
  const createdUtc = executedUtc.length > 0 ? executedUtc : "1970-01-01T00:00:00.000Z";

  return {
    runId: item.runId,
    projectId,
    createdUtc,
    displayName: item.name,
    description: item.name,
    hasFindingsSnapshot: true,
    hasGoldenManifest: false,
  };
}

/** Merge paginated home runs with governance-queue rows so tab counts match visible rows. */
export function resolveAwaitingApprovalTabItems(
  filteredItems: readonly RunSummary[],
  awaitingApprovalItems: readonly GovernanceReviewAwaitingActionItem[],
  projectId: string,
): RunSummary[] {
  const awaitingApprovalRunIds = awaitingApprovalItems
    .map((item) => item.runId.trim())
    .filter((runId) => runId.length > 0);
  const snapshotMatches = filterRunsAwaitingApproval(filteredItems, awaitingApprovalRunIds);
  const snapshotIds = new Set(snapshotMatches.map((run) => run.runId));
  const supplemental = awaitingApprovalItems
    .filter((item) => {
      const runId = item.runId.trim();

      return runId.length > 0 && !snapshotIds.has(runId);
    })
    .map((item) => runSummaryFromGovernanceAwaitingActionItem(item, projectId));

  return [...snapshotMatches, ...supplemental];
}

export {
  deriveRunsDashboardTabCounts,
  isRunApprovedPackage,
  isRunApprovedWithMonitoringPackage,
  isRunNeedingAttention,
  resolveRunHomeStatusTag,
  type RunHomeStatusTag,
  type RunsDashboardTabCounts,
} from "@/lib/operator/run-home-status";

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

export function formatRunsDashboardTabLabelWithCount(label: string, count: number): string {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;

  return `${label} (${safeCount})`;
}

function resolveRunsDashboardTabBaseLabel(
  tabId: RunsDashboardTabId,
  buyerPolishedShell: boolean,
  homePreviewMode: boolean,
): string {
  if (buyerPolishedShell) {
    if (tabId === "all") {
      return BUYER_RUNS_DASHBOARD_FILTER_ALL;
    }

    if (tabId === "approved") {
      return BUYER_RUNS_DASHBOARD_TAB_APPROVED;
    }

    if (tabId === "awaiting-approval") {
      return RUNS_DASHBOARD_LABELS.tabAwaitingApproval;
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

  if (tabId === "awaiting-approval") {
    return RUNS_DASHBOARD_LABELS.tabAwaitingApproval;
  }

  if (tabId === "attention") {
    // Home preview — label matches Approval > Findings in the sidebar.
    if (homePreviewMode) {
      return RUNS_DASHBOARD_LABELS.tabOpenFindings;
    }

    return RUNS_DASHBOARD_LABELS.tabNeedsAttention;
  }

  if (homePreviewMode) {
    return RUNS_DASHBOARD_LABELS.tabMonitoring;
  }

  return RUNS_DASHBOARD_LABELS.tabOutcomes;
}

export type RunsDashboardTabLabelOptions = {
  readonly homePreviewMode?: boolean;
  readonly recentTotalCount?: number;
};

export function runsDashboardTabLabel(
  tabId: RunsDashboardTabId,
  buyerPolishedShell: boolean,
  count?: number,
  options?: RunsDashboardTabLabelOptions,
): string {
  const baseLabel = resolveRunsDashboardTabBaseLabel(
    tabId,
    buyerPolishedShell,
    options?.homePreviewMode === true,
  );

  if (count === undefined) {
    return baseLabel;
  }

  if (
    tabId === "all" &&
    options?.homePreviewMode === true &&
    options.recentTotalCount !== undefined &&
    options.recentTotalCount > count
  ) {
    return `${baseLabel} (${count} of ${options.recentTotalCount})`;
  }

  return formatRunsDashboardTabLabelWithCount(baseLabel, count);
}

function packageOriginBadgeLabel(origin: ArchitecturePackageOriginToken): string {
  if (origin === "created") {
    return BUYER_ARCHITECTURE_PACKAGE_ORIGIN_CREATED_BADGE;
  }

  return BUYER_ARCHITECTURE_PACKAGE_ORIGIN_REVIEWED_BADGE;
}

type ResolvedPackageOrigin = {
  readonly origin: ArchitecturePackageOriginToken;
  readonly label: string;
};

/** Shared visibility gate for both origin presentations: buyer-polished shell, known origin only. */
function resolveBuyerPackageOrigin(
  run: RunSummary,
  buyerPolishedShell: boolean,
): ResolvedPackageOrigin | null {
  if (!buyerPolishedShell) {
    return null;
  }

  const origin = resolveRunSummaryPackageOrigin(run);

  if (origin === null) {
    return null;
  }

  return { origin, label: packageOriginBadgeLabel(origin) };
}

export type ArchitecturePackageOriginProps = {
  readonly run: RunSummary;
  readonly buyerPolishedShell: boolean;
  readonly className?: string;
};

/** Compact origin pill for dense list rows, where no governance status tag sits directly above it. */
export function ArchitecturePackageOriginBadge(props: ArchitecturePackageOriginProps) {
  const resolved = resolveBuyerPackageOrigin(props.run, props.buyerPolishedShell);

  if (resolved === null) {
    return null;
  }

  return (
    <StatusTag
      kind={resolved.origin === "created" ? "ready" : "neutral"}
      label={resolved.label}
      className={props.className}
      data-testid={`architecture-package-origin-${resolved.origin}`}
    />
  );
}

/**
 * Labeled origin line for cards that also show a governance status tag. Provenance rendered as a
 * bare pill next to a verdict pill reads as a competing outcome, so the axis has to be named.
 */
export function ArchitecturePackageOriginMetadataLine(props: ArchitecturePackageOriginProps) {
  const resolved = resolveBuyerPackageOrigin(props.run, props.buyerPolishedShell);

  if (resolved === null) {
    return null;
  }

  return (
    <div className={props.className}>
      <InlineMetadataLine
        label={BUYER_ARCHITECTURE_PACKAGE_ORIGIN_METADATA_LABEL}
        value={resolved.label}
        testId={`architecture-package-origin-${resolved.origin}`}
      />
      {resolved.origin === "reviewed" ? (
        <p className="m-0 mt-1 text-al-text-secondary text-xs leading-relaxed">
          {BUYER_ARCHITECTURE_PACKAGE_ORIGIN_REVIEWED_DISCLOSURE}
        </p>
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
