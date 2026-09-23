"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { formatUsd } from "@/lib/roi-assumptions";
import {
  findingsWhatIfAnalysisHrefFromSearch,
  parseFindingsWhatIfEnabledFromSearch,
  parseFindingsWhatIfIdsFromSearch,
} from "@/lib/findings/findings-what-if-analysis-url";
import {
  hasFindingsWhatIfAnalysisContent,
  readFindingProjectedImpactInterval,
  readFindingProjectedImpactUsd,
} from "@/lib/findings/findings-what-if-analysis";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { Label } from "@/components/ui/label";

export type FindingsWhatIfAnalysisPanelProps = {
  readonly findings: readonly QuickDecisionFinding[];
  /** Annualized baseline architecture cost (typically manifest max monthly × 12). */
  readonly baselineAnnualCostUsd: number | null;
  readonly isIllustrativePricing?: boolean;
};

/** What-if ROI toggle: subtract selected finding savings from baseline annual cost. */
export function FindingsWhatIfAnalysisPanel(props: FindingsWhatIfAnalysisPanelProps) {
  const pathname = usePathname() ?? "";
  const readWhatIfFromUrl = (): { enabled: boolean; ids: readonly string[] } => {
    const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);

    return {
      enabled: parseFindingsWhatIfEnabledFromSearch(params.get("whatIf")),
      ids: parseFindingsWhatIfIdsFromSearch(params.get("whatIfIds")),
    };
  };
  const initialWhatIf = readWhatIfFromUrl();
  const [enabled, setEnabledState] = useState(initialWhatIf.enabled);
  const [selectedIds, setSelectedIdsState] = useState<ReadonlySet<string>>(() => new Set(initialWhatIf.ids));
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const syncWhatIfToUrl = useCallback(
    (nextEnabled: boolean, nextSelectedIds: ReadonlySet<string>) => {
      commitHrefIfChanged(
        findingsWhatIfAnalysisHrefFromSearch(
          readWindowLocationSearch(),
          { enabled: nextEnabled, findingIds: [...nextSelectedIds] },
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname],
  );

  const setEnabled = useCallback(
    (nextEnabled: boolean) => {
      if (enabledRef.current === nextEnabled) {
        return;
      }

      enabledRef.current = nextEnabled;
      setEnabledState(nextEnabled);
      syncWhatIfToUrl(nextEnabled, selectedIdsRef.current);
    },
    [syncWhatIfToUrl],
  );

  const setSelectedIds = useCallback(
    (nextSelectedIds: ReadonlySet<string>) => {
      selectedIdsRef.current = nextSelectedIds;
      setSelectedIdsState(nextSelectedIds);
      syncWhatIfToUrl(enabledRef.current, nextSelectedIds);
    },
    [syncWhatIfToUrl],
  );

  useEffect(() => {
    const syncWhatIfFromUrl = (): void => {
      const { enabled: nextEnabled, ids } = readWhatIfFromUrl();
      const nextSelectedIds = new Set(ids);

      if (enabledRef.current !== nextEnabled) {
        enabledRef.current = nextEnabled;
        setEnabledState(nextEnabled);
      }

      const currentIds = [...selectedIdsRef.current].sort().join(",");
      const incomingIds = [...nextSelectedIds].sort().join(",");

      if (currentIds !== incomingIds) {
        selectedIdsRef.current = nextSelectedIds;
        setSelectedIdsState(nextSelectedIds);
      }
    };

    syncWhatIfFromUrl();
    window.addEventListener("popstate", syncWhatIfFromUrl);

    return () => {
      window.removeEventListener("popstate", syncWhatIfFromUrl);
    };
  }, []);

  const enriched = useMemo(
    () =>
      props.findings.map((finding) => ({
        finding,
        savingsUsd: readFindingProjectedImpactUsd(finding),
        interval: readFindingProjectedImpactInterval(finding),
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
    const next = new Set(selectedIdsRef.current);

    if (next.has(findingId)) {
      next.delete(findingId);
    } else {
      next.add(findingId);
    }

    setSelectedIds(next);
  }

  if (!hasFindingsWhatIfAnalysisContent(props.findings, baseline))
    return null;

  return (
    <section
      data-testid="findings-what-if-analysis"
      className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>What-if cost analysis</h3>
            {props.isIllustrativePricing && isOperatorExperienceFullShellEnv() && (
              <span 
                className={cn("inline-flex items-center rounded-md bg-amber-100 px-2 py-1 font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-500/20", OPERATOR_TYPOGRAPHY.helper)}
                aria-label="Illustrative Retail Pricing: Actual EA discounts may vary"
                data-testid="illustrative-pricing-badge"
              >
                Illustrative Retail Pricing
              </span>
            )}
          </div>
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Select findings to model projected annual architecture cost after applying recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="what-if-enabled"
            type="checkbox"
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
            }}
            aria-label="Enable what-if analysis"
          />
          <Label htmlFor="what-if-enabled" className={OPERATOR_TYPOGRAPHY.body}>
            What-if mode
          </Label>
        </div>
      </div>

      {baseline !== null ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className={cn("font-medium uppercase text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Baseline annual cost</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{formatUsd(baseline)}</dd>
          </div>
          <div>
            <dt className={cn("font-medium uppercase text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Projected new cost</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-al-text-secondary dark:text-neutral-200">
              {projected !== null ? formatUsd(projected) : " — "}
            </dd>
          </div>
        </dl>
      ) : null}

      {enabled ? (
        <ul className="m-0 mt-4 list-none space-y-2 p-0">
          {enriched.map((row) => (
            <li key={row.finding.findingId}>
              <label className={cn("flex cursor-pointer items-start gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/60", OPERATOR_TYPOGRAPHY.body)}>
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.has(row.finding.findingId)}
                  onChange={() => toggleFinding(row.finding.findingId)}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{row.finding.title}</span>
                  {row.savingsUsd > 0 ? (
                    <span className={cn("ml-2 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                      −{formatUsd(row.savingsUsd)}
                      {row.interval && (
                        <span className="ml-1 opacity-75">
                          (Range: {row.interval.lower !== null ? formatUsd(row.interval.lower) : "?"} - {row.interval.upper !== null ? formatUsd(row.interval.upper) : "?"})
                        </span>
                      )}
                    </span>
                  ) : null}
                  {row.interval?.reasoning && (
                    <p className={cn("m-0 mt-0.5 text-neutral-500 italic", OPERATOR_TYPOGRAPHY.helper)}>
                      {row.interval.reasoning}
                    </p>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
