"use client";

import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import { StatusTag } from "@/components/ui/status-tag";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
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
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  resolveRunSummaryPackageOrigin,
  type ArchitecturePackageOriginToken,
} from "@/lib/architecture/architecture-package-origin";
import { OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN } from "@/lib/operator/operator-home-example-request";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";

export function runListPrimaryTitle(run: RunSummary): string {
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

export type RunsDashboardTabCounts = Readonly<Record<RunsDashboardTabId, number>>;

export type RunHomeStatusTag = {
  readonly kind: EnterpriseStatusKind;
  readonly label?: string;
};

export function resolveRunHomeStatusTag(run: RunSummary): RunHomeStatusTag {
  if (isRunNeedingAttention(run)) {
    return { kind: "needs-attention" };
  }

  if (isRunApprovedWithMonitoringPackage(run)) {
    return { kind: "approved-with-monitoring" };
  }

  if (isRunApprovedPackage(run)) {
    return { kind: "approved" };
  }

  if (run.hasFindingsSnapshot === true) {
    return { kind: "in-progress" };
  }

  return { kind: "draft", label: "Draft" };
}

export function deriveRunsDashboardTabCounts(items: readonly RunSummary[]): RunsDashboardTabCounts {
  return {
    all: items.length,
    approved: items.filter(isRunApprovedPackage).length,
    attention: items.filter(isRunNeedingAttention).length,
    outcomes: items.filter(isRunApprovedWithMonitoringPackage).length,
  };
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
    // Home preview only — distinct from the "Awaiting approval" attention chip above.
    if (homePreviewMode) {
      return RUNS_DASHBOARD_LABELS.tabOpenFindings;
    }

    return RUNS_DASHBOARD_LABELS.tabNeedsAttention;
  }

  return RUNS_DASHBOARD_LABELS.tabOutcomes;
}

export function runsDashboardTabLabel(
  tabId: RunsDashboardTabId,
  buyerPolishedShell: boolean,
  count?: number,
  options?: { readonly homePreviewMode?: boolean },
): string {
  const baseLabel = resolveRunsDashboardTabBaseLabel(
    tabId,
    buyerPolishedShell,
    options?.homePreviewMode === true,
  );

  if (count === undefined) {
    return baseLabel;
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
