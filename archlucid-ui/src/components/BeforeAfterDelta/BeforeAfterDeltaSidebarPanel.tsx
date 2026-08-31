"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY, OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";

import { DELTA_RECENT_REVIEWS_SIDEBAR_HELP } from "./deltaRecentReviewsCopy";
import {
  formatFindings,
  formatHours,
  hasMeaningfulSidebarDeltaMedians,
  safeCommittedRunWindowCount,
} from "./formatDelta";
import { useDeltaQuery } from "./useDeltaQuery";

/**
 * "Sidebar" placement of `BeforeAfterDeltaPanel` — compact single-card rendering of
 * the same medians the top variant shows. Designed to live as a collapsible card
 * under the sidebar's "Recent activity" group.
 *
 * Reuses `useDeltaQuery` so the network shape and loading semantics are identical
 * to the top variant; the only difference is the rendered chrome (smaller heading,
 * no per-run row strip, label-and-value pairs stacked vertically).
 *
 * Hidden when zero committed runs are in scope (same rule as the top variant) so
 * the sidebar does not start with a sad-empty card on a fresh tenant.
 */
export type BeforeAfterDeltaSidebarPanelProps = {
  count?: number;
};

export function BeforeAfterDeltaSidebarPanel({ count = 5 }: BeforeAfterDeltaSidebarPanelProps) {
  const { status, data } = useDeltaQuery({ count });

  if (status !== "ready" || data === null) return null;
  const windowCount = safeCommittedRunWindowCount(data.returnedCount);

  if (windowCount === null || windowCount < 1) return null;

  if (!hasMeaningfulSidebarDeltaMedians(data)) return null;

  return (
    <aside
      data-testid="before-after-delta-panel-sidebar"
      role="complementary"
      aria-label="Median proof-of-ROI deltas (sidebar)"
      className={cn("rounded-md border border-neutral-200 bg-neutral-50 p-3 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
    >
      <p
        className={cn(
          "m-0 mb-2 flex items-start gap-1 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
          OPERATOR_NAV_GROUP_LABEL,
        )}
      >
        <span>
          Typical last <span data-testid="delta-sidebar-window">{windowCount}</span> finalized review(s)
        </span>
        <FieldHelpTooltip
          label="Typical finalized reviews"
          hint={DELTA_RECENT_REVIEWS_SIDEBAR_HELP}
          side="right"
        />
      </p>
      <dl className="m-0 grid grid-cols-2 gap-2">
        <div>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
            Findings / review
          </dt>
          <dd
            data-testid="delta-sidebar-median-findings"
            className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {formatFindings(data.medianTotalFindings)}
          </dd>
        </div>
        <div>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
            Time to finalize
          </dt>
          <dd
            data-testid="delta-sidebar-median-time"
            className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {formatHours(data.medianTimeToCommittedManifestTotalSeconds)}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
