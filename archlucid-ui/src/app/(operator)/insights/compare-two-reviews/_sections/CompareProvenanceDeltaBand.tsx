"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useCompareProvenanceTrailsQuery } from "@/hooks/use-compare-provenance-trails-query";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";
import {
  listCompareAssumptionDiffItems,
  summarizeCompareProvenanceDelta,
} from "@/lib/compare/compare-provenance-delta-summary";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import { feasibilityVerdictKindLabel } from "@/lib/feasibility-verdict-display";
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

/** Working Compare hoists asserted / inferred / skipped MUST divergence (WA-09). Guided keeps a compact summary. */
export function CompareProvenanceDeltaBand(props: CompareProvenanceDeltaBandProps): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const query = useCompareProvenanceTrailsQuery(props.baselineRunId, props.targetRunId);

  if (query.isError) {
    const failure = toApiLoadFailure(query.error);
    const blockedReason = compareRunPairBlockedReason(failure);

    return (
      <section
        className="rounded-md border border-rose-600/40 bg-rose-50/80 p-4 dark:border-rose-700/50 dark:bg-rose-950/30"
        data-testid="compare-provenance-delta-band-error"
        role="alert"
      >
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)}>
          {blockedReason ?? failure.message}
        </p>
      </section>
    );
  }

  if (query.data === undefined) {
    return null;
  }

  const assumptionDiffs = listCompareAssumptionDiffItems(props.manifestDiffs);
  const summary = summarizeCompareProvenanceDelta(
    {
      runId: query.data.baseline.runId,
      label: compareRunHeadingLabel(props.baselineRunId, props.baselinePickedSummary),
      trail: query.data.baseline.trail,
      missingTrailDefect: query.data.baseline.missingTrailDefect,
      feasibilityVerdictKind: query.data.baseline.feasibilityVerdictKind,
    },
    {
      runId: query.data.target.runId,
      label: compareRunHeadingLabel(props.targetRunId, props.targetPickedSummary),
      trail: query.data.target.trail,
      missingTrailDefect: query.data.target.missingTrailDefect,
      feasibilityVerdictKind: query.data.target.feasibilityVerdictKind,
    },
    assumptionDiffs,
  );

  if (!summary.showBand) {
    return null;
  }

  const baselineSkippedMust = listSkippedMustQuestionKeys(summary.baseline.trail).length;
  const targetSkippedMust = listSkippedMustQuestionKeys(summary.target.trail).length;

  if (!isWorkingMode) {
    return (
      <section
        id="compare-provenance"
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
        data-testid="compare-provenance-delta-band"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Assumption and provenance delta
        </h2>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Baseline asserted {summary.baseline.trail?.asserted.length ?? 0}, skipped MUST {baselineSkippedMust} ·
          Updated asserted {summary.target.trail?.asserted.length ?? 0}, skipped MUST {targetSkippedMust}.
          {summary.assumptionDiffCount > 0
            ? ` Manifest assumptions changed in ${summary.assumptionDiffCount} row${summary.assumptionDiffCount === 1 ? "" : "s"}.`
            : ""}{" "}
          Open Technical details for the full trail.
        </p>
      </section>
    );
  }

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

      {summary.feasibilityVerdictChanged ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="compare-feasibility-verdict-delta">
          Feasibility verdict changed — baseline{" "}
          {summary.baseline.feasibilityVerdictKind !== null
            ? feasibilityVerdictKindLabel(summary.baseline.feasibilityVerdictKind)
            : "unknown"}{" "}
          · updated{" "}
          {summary.target.feasibilityVerdictKind !== null
            ? feasibilityVerdictKindLabel(summary.target.feasibilityVerdictKind)
            : "unknown"}
          .
        </p>
      ) : null}

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
