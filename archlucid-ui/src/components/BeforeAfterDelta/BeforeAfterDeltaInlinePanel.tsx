"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { formatFindings, formatHours, percentDelta } from "./formatDelta";
import { pickPriorForSameRequest } from "./pick-prior-for-same-request";
import type { RecentPilotRunDeltaRow } from "./types";
import { useDeltaQuery } from "./useDeltaQuery";

/**
 * "Inline" placement of `BeforeAfterDeltaPanel` — rendered above the artifacts
 * table on `/architecture/reviews/{runId}`. Shows the **single-run delta vs the prior committed
 * run for the same architecture request** so an operator can see whether this
 * commit improved on the previous one (fewer findings, shorter time, etc.).
 *
 * Approach:
 *  1. Fetch `/v1/pilots/runs/recent-deltas?count=25` (the same shared hook the
 *     top/sidebar variants use — one less HTTP surface to mock and rate-limit).
 *  2. Locate the **current** run inside `items` so the variant does not need a
 *     separate per-run lookup.
 *  3. Pick the **most recent prior committed run** with a matching `requestId`
 *     and an earlier `manifestCommittedUtc`.
 *  4. If no prior is found, render a small "no prior commit for this request" hint
 *     instead of nothing — it is information for the operator that this is the
 *     first commit on this request, not a broken panel.
 *
 * The 25-row window matches the server's hard ceiling so any prior commit that
 * is still in the recent window will be visible; older priors are invisible to
 * this variant by design (use `/insights/compare-two-reviews` for the full history).
 */
export type BeforeAfterDeltaInlinePanelProps = {
  runId: string;
};

const INLINE_LOOKBACK_COUNT = 25;

export function BeforeAfterDeltaInlinePanel({ runId }: BeforeAfterDeltaInlinePanelProps) {
  const { status, data } = useDeltaQuery({ count: INLINE_LOOKBACK_COUNT });

  if (status !== "ready" || data === null) return null;

  const current = data.items.find((row) => row.runId === runId);

  if (current === undefined) return null;

  const prior = pickPriorForSameRequest(current, data.items);

  return (
    <section
      data-testid="before-after-delta-panel-inline"
      role="region"
      aria-label="Delta vs prior finalized review for the same architecture request"
      className="mb-4 max-w-3xl rounded-md border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        Delta vs prior finalization (same request)
      </h3>
      {prior === null ? (
        <p
          data-testid="delta-inline-no-prior"
          className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        >
          No prior finalized review found for request{" "}
          <code className={cn("rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>
            {current.requestId === "" ? "(unknown)" : current.requestId}
          </code>{" "}
          in the recent window. This is the first finalization for this request — future reviews will compare here.
        </p>
      ) : (
        <BeforeAfterDeltaInlineComparisonRow current={current} prior={prior} />
      )}
    </section>
  );
}

function BeforeAfterDeltaInlineComparisonRow({
  current,
  prior,
}: {
  current: RecentPilotRunDeltaRow;
  prior: RecentPilotRunDeltaRow;
}) {
  const findingsDelta = percentDelta(prior.totalFindings, current.totalFindings);
  const timeDelta = percentDelta(
    prior.timeToCommittedManifestTotalSeconds,
    current.timeToCommittedManifestTotalSeconds,
  );

  return (
    <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
        <dt className={cn("font-medium uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Findings</dt>
        <dd
          data-testid="delta-inline-findings"
          className={cn("mt-1 font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}
        >
          {formatFindings(current.totalFindings)}{" "}
          <span className={cn("font-normal text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            (prior: {formatFindings(prior.totalFindings)})
          </span>
        </dd>
        {findingsDelta !== null ? (
          <dd
            data-testid="delta-inline-findings-percent"
            className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          >
            {findingsDelta >= 0
              ? `${findingsDelta.toFixed(1)}% fewer findings vs prior finalization`
              : `${Math.abs(findingsDelta).toFixed(1)}% more findings vs prior finalization`}
          </dd>
        ) : null}
      </div>
      <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
        <dt className={cn("font-medium uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Time to finalized review
        </dt>
        <dd
          data-testid="delta-inline-time"
          className={cn("mt-1 font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}
        >
          {formatHours(current.timeToCommittedManifestTotalSeconds)}{" "}
          <span className={cn("font-normal text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            (prior: {formatHours(prior.timeToCommittedManifestTotalSeconds)})
          </span>
        </dd>
        {timeDelta !== null ? (
          <dd
            data-testid="delta-inline-time-percent"
            className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          >
            {timeDelta >= 0
              ? `${timeDelta.toFixed(1)}% faster vs prior finalization`
              : `${Math.abs(timeDelta).toFixed(1)}% slower vs prior finalization`}
          </dd>
        ) : null}
      </div>
    </dl>
  );
}
