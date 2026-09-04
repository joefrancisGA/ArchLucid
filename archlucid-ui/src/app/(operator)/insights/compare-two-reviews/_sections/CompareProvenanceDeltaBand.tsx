"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useCompareProvenanceTrailsQuery } from "@/hooks/use-compare-provenance-trails-query";
import {
  listCompareAssumptionDiffItems,
  summarizeCompareProvenanceDelta,
} from "@/lib/compare/compare-provenance-delta-summary";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { listSkippedMustQuestionKeys } from "@/lib/review-quality/list-skipped-must-question-keys";
import type { DiffItem, RunSummary } from "@/types/authority";
import { cn } from "@/lib/utils";

export type CompareProvenanceDeltaBandProps = {
  readonly baselineRunId: string;
  readonly targetRunId: string;
  readonly baselinePickedSummary: RunSummary | null;
  readonly targetPickedSummary: RunSummary | null;
  readonly manifestDiffs?: readonly DiffItem[];
};

/** Working Compare hoists asserted / inferred / skipped MUST divergence (WA-09). */
export function CompareProvenanceDeltaBand(props: CompareProvenanceDeltaBandProps): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const query = useCompareProvenanceTrailsQuery(props.baselineRunId, props.targetRunId, {
    enabled: isWorkingMode,
  });

  if (!isWorkingMode || query.data === undefined) {
    return null;
  }

  const assumptionDiffs = listCompareAssumptionDiffItems(props.manifestDiffs);
  const summary = summarizeCompareProvenanceDelta(
    {
      runId: query.data.baseline.runId,
      label: compareRunHeadingLabel(props.baselineRunId, props.baselinePickedSummary),
      trail: query.data.baseline.trail,
      missingTrailDefect: query.data.baseline.missingTrailDefect,
    },
    {
      runId: query.data.target.runId,
      label: compareRunHeadingLabel(props.targetRunId, props.targetPickedSummary),
      trail: query.data.target.trail,
      missingTrailDefect: query.data.target.missingTrailDefect,
    },
    assumptionDiffs,
  );

  if (!summary.showBand) {
    return null;
  }

  const baselineSkippedMust = listSkippedMustQuestionKeys(summary.baseline.trail).length;
  const targetSkippedMust = listSkippedMustQuestionKeys(summary.target.trail).length;

  return (
    <section
      id="compare-provenance"
      className="space-y-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="compare-provenance-delta-band"
    >
      <div className="space-y-1">
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Assumption and provenance delta
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Compare what each package asserted, inferred, or skipped before you defend cost or finding changes.
        </p>
      </div>

      <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="font-medium text-al-text-primary">Baseline — {summary.baseline.label}</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">
            Asserted {summary.baseline.trail?.asserted.length ?? 0} · Inferred{" "}
            {summary.baseline.trail?.inferred.length ?? 0} · Skipped MUST {baselineSkippedMust}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-al-text-primary">Updated — {summary.target.label}</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">
            Asserted {summary.target.trail?.asserted.length ?? 0} · Inferred{" "}
            {summary.target.trail?.inferred.length ?? 0} · Skipped MUST {targetSkippedMust}
          </dd>
        </div>
      </dl>

      {summary.assumptionDiffCount > 0 ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="compare-assumptions-diff-count">
          Manifest assumptions changed in {summary.assumptionDiffCount} row
          {summary.assumptionDiffCount === 1 ? "" : "s"} — see Technical details for the full list.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <TransparencyTrailPanel
          trail={summary.baseline.trail}
          missingTrailDefect={summary.baseline.missingTrailDefect}
          defaultExpanded
        />
        <TransparencyTrailPanel
          trail={summary.target.trail}
          missingTrailDefect={summary.target.missingTrailDefect}
          defaultExpanded
        />
      </div>

      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        Open packages:{" "}
        <Link
          className={OPERATOR_LINK.inline}
          href={`/architecture/reviews/${encodeURIComponent(summary.baseline.runId)}`}
        >
          Baseline review
        </Link>
        {" · "}
        <Link
          className={OPERATOR_LINK.inline}
          href={`/architecture/reviews/${encodeURIComponent(summary.target.runId)}`}
        >
          Updated review
        </Link>
      </p>
    </section>
  );
}
