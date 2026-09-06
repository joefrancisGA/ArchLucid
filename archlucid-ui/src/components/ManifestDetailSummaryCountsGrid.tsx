import Link from "next/link";
import type { ReactElement } from "react";

import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { BUYER_EXAMPLE_COUNT_SUFFIX } from "@/lib/buyer/buyer-polish-copy";
import {
  SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT,
  SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
} from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
import type { ManifestSummary } from "@/types/authority";

export type ManifestDetailSummaryCountsGridProps = {
  readonly summary: ManifestSummary;
  readonly buyerPolishedLayout: boolean;
};

export function ManifestDetailSummaryCountsGrid({
  summary,
  buyerPolishedLayout,
}: ManifestDetailSummaryCountsGridProps): ReactElement {
  const isCuratedDemo = summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID;
  const includeShowcaseTrailTiles = buyerPolishedLayout && isCuratedDemo;
  const runIdForNavigation = isCuratedDemo
    ? canonicalizeDemoRunId(summary.runId)
    : summary.runId;

  const gridClassName = includeShowcaseTrailTiles
    ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
    : "grid grid-cols-2 gap-3 sm:grid-cols-4";

  const graphHref = `/insights/evidence-graph?runId=${encodeURIComponent(runIdForNavigation)}`;
  const auditHref = auditTrailNavHref(runIdForNavigation);

  const manifestTileLabelClass = cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400");

  return (
    <div className={gridClassName}>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className={manifestTileLabelClass}>Status</p>
        <p className="m-0 mt-2">
          <span className={cn(
            "inline-flex items-center rounded-full border border-emerald-700/40 bg-al-surface-raised px-2.5 py-0.5 text-al-text-primary dark:border-emerald-800/50",
            OPERATOR_TYPOGRAPHY.badge,
          )}>
            {manifestStatusForDisplay(summary.status)}
          </span>
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className={manifestTileLabelClass}>Decisions</p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
          {Number.isFinite(summary.decisionCount) ? summary.decisionCount : " — "}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className={manifestTileLabelClass}>
          {buyerPolishedLayout && isCuratedDemo ? "Monitored risks" : "Warnings"}
        </p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
          {Number.isFinite(summary.warningCount) ? summary.warningCount : " — "}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className={manifestTileLabelClass}>Unresolved</p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
          {Number.isFinite(summary.unresolvedIssueCount) ? summary.unresolvedIssueCount : " — "}
        </p>
      </div>
      {includeShowcaseTrailTiles ? (
        <>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className={manifestTileLabelClass}>
              {BUYER_SURFACE_VOCABULARY.evidenceGraph}
            </p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
              {SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT}
            </p>
            <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Linked records in review trail layout</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className={OPERATOR_LINK.nav} href={graphHref}>
                Open interactive graph
              </Link>
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className={manifestTileLabelClass}>
              Audit trail
            </p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
              {SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT}
            </p>
            <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Lifecycle events in audit trail</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className={OPERATOR_LINK.nav} href={auditHref}>
                Open full audit trail
              </Link>
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

export type ManifestDetailSummaryBuyerPackCardsProps = {
  readonly summary: ManifestSummary;
  readonly buyerPolishedLayout: boolean;
};

export function ManifestDetailSummaryBuyerPackCards({
  summary,
  buyerPolishedLayout,
}: ManifestDetailSummaryBuyerPackCardsProps): ReactElement | null {
  const isCuratedDemo = summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID;

  if (!isCuratedDemo) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="manifest-buyer-pack-summary-cards">
      <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Decisions recorded</p>
        <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>{summary.decisionCount}</p>
        <Link
          className={cn("m-0 mt-2 inline-block", OPERATOR_LINK.nav)}
          href={buyerPolishedLayout ? "#manifest-key-decisions" : "#manifest-buyer-recorded-details"}
        >
          View decision list
        </Link>
      </div>
      <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Monitored risks</p>
        <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>{summary.warningCount}</p>
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}>Tracked with policy cadence.</p>
      </div>
      <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Unresolved blocking issues</p>
        <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>{summary.unresolvedIssueCount}</p>
      </div>
      <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Evidence graph anchors</p>
        <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
          {SHOWCASE_STATIC_DEMO_GRAPH_LINKED_RECORD_COUNT} {BUYER_EXAMPLE_COUNT_SUFFIX}
        </p>
        <Link
          href={`/insights/evidence-graph?runId=${encodeURIComponent(canonicalizeDemoRunId(summary.runId))}`}
          className={cn("m-0 mt-2 inline-block", OPERATOR_LINK.nav)}
        >
          Explore decision traceability graph
        </Link>
      </div>
      <div className={cn("rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Audit events</p>
        <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
          {SHOWCASE_STATIC_DEMO_AUDIT_TRAIL_EVENT_COUNT} {BUYER_EXAMPLE_COUNT_SUFFIX}
        </p>
        <Link
          href={auditTrailNavHref(canonicalizeDemoRunId(summary.runId))}
          className={cn("m-0 mt-2 inline-block", OPERATOR_LINK.nav)}
        >
          View audit trail
        </Link>
      </div>
    </div>
  );
}
