import type { ReactElement } from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import { buildCompareVerdictSummary } from "@/lib/build-compare-verdict-summary";
import { COMPARE_VERDICT_ZERO_CHANGES_TEACHING } from "@/lib/compare-empty-diff-teaching";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { RunSummary } from "@/types/authority";

export type CompareVerdictSummaryProps = {
  readonly golden: GoldenManifestComparison;
  readonly baselinePickedSummary?: RunSummary | null;
  readonly updatedPickedSummary?: RunSummary | null;
};

export function CompareVerdictSummary(props: CompareVerdictSummaryProps): ReactElement {
  const verdict = buildCompareVerdictSummary(props.golden);
  const baselineLabel = compareRunHeadingLabel(verdict.baselineRunId, props.baselinePickedSummary ?? null);
  const updatedLabel = compareRunHeadingLabel(verdict.targetRunId, props.updatedPickedSummary ?? null);
  const highlightSourceLabel =
    verdict.topChangeHighlight?.source === "deterministic"
      ? "from structured comparison summary"
      : "from AI narrative";

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      aria-label="Comparison verdict"
      data-testid="compare-verdict-summary"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Baseline review</p>
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{baselineLabel}</p>
        </div>
        <div className="space-y-1">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Updated review</p>
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{updatedLabel}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          <span className="text-al-text-secondary">Total changes:</span> {verdict.totalChanges}
        </p>
        {verdict.categoryCounts.length > 0 ? (
          <ul
            className={cn("m-0 flex list-none flex-wrap gap-2 p-0", OPERATOR_TYPOGRAPHY.body)}
            data-testid="compare-verdict-category-counts"
          >
            {verdict.categoryCounts.map((row) => (
              <li
                key={row.key}
                className="rounded-md border border-neutral-200 bg-al-surface-raised px-2.5 py-1 dark:border-neutral-700"
              >
                <span className="text-al-text-secondary">{row.label}</span>{" "}
                <span className="font-semibold text-al-text-primary">{row.count}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {verdict.totalChanges === 0 ? (
        <p
          className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="compare-verdict-zero-changes-teaching"
        >
          {COMPARE_VERDICT_ZERO_CHANGES_TEACHING}
        </p>
      ) : null}

      {verdict.topChangeHighlight !== null ? (
        <p
          className={cn(
            "m-0 mt-4 rounded-md border border-neutral-200 bg-al-surface-raised p-3 text-al-text-primary dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="compare-top-change-highlight"
        >
          <strong>Top change highlight</strong>{" "}
          <span className="text-al-text-secondary">({highlightSourceLabel}):</span>{" "}
          <Link
            href={`#${verdict.topChangeHighlight.supportingSectionId}`}
            className={OPERATOR_LINK.inline}
          >
            {verdict.topChangeHighlight.text}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
