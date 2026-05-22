"use client";

import { useMemo, useState } from "react";

import { formatUsd } from "@/lib/roi-assumptions";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { Label } from "@/components/ui/label";

export type FindingsWhatIfAnalysisPanelProps = {
  readonly findings: readonly QuickDecisionFinding[];
  /** Annualized baseline architecture cost (typically manifest max monthly × 12). */
  readonly baselineAnnualCostUsd: number | null;
  readonly isIllustrativePricing?: boolean;
};

function readEstimatedUsdSavings(finding: QuickDecisionFinding): number {
  try {
    const parsed = JSON.parse(finding.aiReasoning.wireJson) as { projectedImpactUsd?: unknown };
    const value = parsed.projectedImpactUsd;

    if (typeof value === "number" && Number.isFinite(value))
      return value;

    return 0;
  } catch {
    return 0;
  }
}

/** What-if ROI toggle: subtract selected finding savings from baseline annual cost. */
export function FindingsWhatIfAnalysisPanel(props: FindingsWhatIfAnalysisPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

  const enriched = useMemo(
    () =>
      props.findings.map((finding) => ({
        finding,
        savingsUsd: readEstimatedUsdSavings(finding),
      })),
    [props.findings],
  );

  const selectedSavings = useMemo(() => {
    if (!enabled)
      return 0;

    return enriched
      .filter((row) => selectedIds.has(row.finding.findingId))
      .reduce((sum, row) => sum + row.savingsUsd, 0);
  }, [enabled, enriched, selectedIds]);

  const baseline = props.baselineAnnualCostUsd;
  const projected = baseline !== null && enabled ? Math.max(0, baseline - selectedSavings) : baseline;

  function toggleFinding(findingId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(findingId))
        next.delete(findingId);
      else
        next.add(findingId);

      return next;
    });
  }

  if (baseline === null && enriched.every((row) => row.savingsUsd <= 0))
    return null;

  return (
    <section
      data-testid="findings-what-if-analysis"
      className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">What-if cost analysis</h3>
            {props.isIllustrativePricing && (
              <span 
                className="inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-500/20"
                title="Illustrative Retail Pricing: Actual EA discounts may vary"
                data-testid="illustrative-pricing-badge"
              >
                Illustrative Retail Pricing
              </span>
            )}
          </div>
          <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Select findings to model projected annual architecture cost after applying recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="what-if-enabled"
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            aria-label="Enable what-if analysis"
          />
          <Label htmlFor="what-if-enabled" className="text-sm">
            What-if mode
          </Label>
        </div>
      </div>

      {baseline !== null ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-neutral-500">Baseline annual cost</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{formatUsd(baseline)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-neutral-500">Projected new cost</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-teal-800 dark:text-teal-200">
              {projected !== null ? formatUsd(projected) : "—"}
            </dd>
          </div>
        </dl>
      ) : null}

      {enabled ? (
        <ul className="m-0 mt-4 list-none space-y-2 p-0">
          {enriched.map((row) => (
            <li key={row.finding.findingId}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950/60">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.has(row.finding.findingId)}
                  onChange={() => toggleFinding(row.finding.findingId)}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{row.finding.title}</span>
                  {row.savingsUsd > 0 ? (
                    <span className="ml-2 text-xs text-neutral-500">−{formatUsd(row.savingsUsd)}</span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
