"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { ReplayCostPreExecuteCostVocabularyRail } from "@/components/ReplayCostPreExecuteCostVocabularyRail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComparisonReplayCostEstimateResponse } from "@/lib/api/comparison-replay-cost-api";
import { fetchArchitectureComparisonReplayCostEstimate } from "@/lib/api/comparison-replay-cost-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { replayModeLabel, REPLAY_MODE_PLAIN_OPTIONS } from "@/lib/replay-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReplayValidationModeId } from "@/lib/replay-validation-workflow";
import {
  comparisonReplayCostHrefFromSearch,
  parseComparisonFormatFromSearch,
  parseComparisonRecordIdFromSearch,
  parseComparisonReplayModeFromSearch,
  parseComparisonReplayPersistFromSearch,
} from "@/lib/compare/comparison-replay-cost-url";

/** Warn-only cost band estimate for architecture comparison replay (distinct from review-package validation). */

export function ArchitectureComparisonReplayCostSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [comparisonRecordId, setComparisonRecordId] = useState(() =>
    parseComparisonRecordIdFromSearch(searchParams.get("comparisonRecordId")),
  );
  const [replayMode, setReplayMode] = useState<ReplayValidationModeId | "">(() =>
    parseComparisonReplayModeFromSearch(searchParams.get("replayMode")),
  );
  const [persistReplay, setPersistReplay] = useState(() =>
    parseComparisonReplayPersistFromSearch(searchParams.get("persist")),
  );
  const [format, setFormat] = useState(() => parseComparisonFormatFromSearch(searchParams.get("comparisonFormat")));

  const [estimate, setEstimate] = useState<ComparisonReplayCostEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  useEffect(() => {
    setComparisonRecordId(parseComparisonRecordIdFromSearch(searchParams.get("comparisonRecordId")));
    setReplayMode(parseComparisonReplayModeFromSearch(searchParams.get("replayMode")));
    setPersistReplay(parseComparisonReplayPersistFromSearch(searchParams.get("persist")));
    setFormat(parseComparisonFormatFromSearch(searchParams.get("comparisonFormat")));
  }, [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = comparisonReplayCostHrefFromSearch(searchParams.toString(), {
        comparisonRecordId,
        replayMode,
        persistReplay,
        format,
      });

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [comparisonRecordId, format, persistReplay, replayMode, router, searchParams]);

  const trimmedId = comparisonRecordId.trim();

  const executeEstimate = useCallback(
    async (opts: Readonly<{ showBusySpinner: boolean }>): Promise<void> => {
      if (trimmedId.length === 0) {
        return;
      }

      setFailure(null);

      if (opts.showBusySpinner) {
        setLoading(true);
      }

      try {
        const resolved = await fetchArchitectureComparisonReplayCostEstimate(trimmedId, {
          replayMode: replayMode.trim().length > 0 ? replayMode.trim() : undefined,
          format: format.trim().length > 0 ? format.trim() : undefined,
          persistReplay,
        });

        setEstimate(resolved);
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));

        setEstimate(null);
        setFailure(toApiLoadFailure(err));
      } finally {
        if (opts.showBusySpinner) {
          setLoading(false);
        }
      }
    },
    [format, persistReplay, replayMode, trimmedId],
  );

  useEffect(() => {
    if (trimmedId.length === 0) {
      setEstimate(null);
      setFailure(null);

      return;
    }

    const timer = window.setTimeout(() => {
      void executeEstimate({ showBusySpinner: false });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [executeEstimate, trimmedId]);

  return (
    <section className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 max-w-3xl p-4">
      <ReplayCostPreExecuteCostVocabularyRail currentSurfaceId="replay-cost" />
      <h3 className={cn("mt-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Comparison replay cost estimate (warn-only)</h3>
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Estimate relative cost before you replay a saved comparison record. This is separate from validating a single review on the
        validate page.
      </p>

      <div className="mt-3 grid max-w-xl gap-3">
        <div className="space-y-2">
          <Label htmlFor="comparison-record-id-cost">Comparison record</Label>
          <Input
            id="comparison-record-id-cost"
            value={comparisonRecordId}
            placeholder="Saved comparison record identifier"
            onChange={(ev) => {
              setComparisonRecordId(ev.target.value);
            }}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comparison-replay-format">Export format hint (optional)</Label>
          <Input
            id="comparison-replay-format"
            value={format}
            placeholder="Leave blank unless a specific export format narrows the estimate"
            onChange={(ev) => {
              setFormat(ev.target.value);
            }}
            autoComplete="off"
          />
        </div>

        <fieldset className="space-y-2 rounded-md border border-amber-200/80 bg-white/40 p-3 dark:border-amber-800 dark:bg-neutral-950/60">
          <legend className={cn("px-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Validation mode (optional)</legend>
          <select
            className={cn(
              "max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            value={replayMode}
            aria-label="Optional validation mode for comparison replay cost estimate"
            onChange={(e) => {
              setReplayMode(parseComparisonReplayModeFromSearch(e.target.value));
            }}
          >
            <option value="">Default</option>
            {REPLAY_MODE_PLAIN_OPTIONS.map((row) => (
              <option key={row.mode} value={row.mode}>
                {row.label}
              </option>
            ))}
          </select>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {replayMode.trim().length > 0
              ? replayModeLabel(replayMode)
              : "Only set this when you need a cost estimate aligned with a heavier comparison replay."}
          </p>
        </fieldset>

        <label className={cn("flex cursor-pointer items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <input
            type="checkbox"
            className="size-4 rounded border border-neutral-300 text-teal-800 focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900"
            checked={persistReplay}
            onChange={(ev) => {
              setPersistReplay(ev.target.checked);
            }}
          />
          Include persisted replay in estimate
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading || trimmedId.length === 0}
            onClick={() => void executeEstimate({ showBusySpinner: true })}
          >
            {loading ? "Estimating…" : "Refresh cost estimate"}
          </Button>
          <p className={cn("m-0 w-full text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Estimates also refresh silently ~450ms after you stop typing.
          </p>
        </div>

        {failure !== null ? <OperatorApiProblem failure={failure} /> : null}

        {estimate !== null ? (
          <div className="rounded-md border border-amber-400/70 bg-white/80 px-3 py-2 dark:border-amber-600 dark:bg-neutral-950">
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Estimated band: <span className="font-semibold">{estimate.relativeCostBand}</span>{" "}
              {typeof estimate.approximateRelativeScore === "number" ? (
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  ({String(estimate.approximateRelativeScore)} / 100)
                </span>
              ) : null}
            </p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Comparison <span className="font-mono">{estimate.comparisonRecordId}</span> · type{" "}
              <span className="font-mono">{estimate.comparisonType}</span> · format <span className="font-mono">{estimate.format}</span>
            </p>

            {(estimate.factors?.length ?? 0) > 0 ? (
              <Fragment>
                <p className={cn("m-0 mt-2 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Signals</p>
                <ul className={cn("m-0 list-disc space-y-1 pl-6 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                  {(estimate.factors ?? []).map((factor, idx) => (
                    <li key={`${estimate.comparisonRecordId}-factor-${String(idx)}`}>{factor}</li>
                  ))}
                </ul>
              </Fragment>
            ) : null}
            <p className={cn("m-0 mt-2 font-medium text-amber-950 dark:text-amber-50", OPERATOR_TYPOGRAPHY.helper)}>
              Guidance only — not a hard block before any downstream replay or export you trigger elsewhere.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
