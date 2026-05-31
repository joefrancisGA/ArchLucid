"use client";

import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComparisonReplayCostEstimateResponse } from "@/lib/api/comparison-replay-cost-api";
import { fetchArchitectureComparisonReplayCostEstimate } from "@/lib/api/comparison-replay-cost-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { replayModeLabel, REPLAY_MODE_PLAIN_OPTIONS } from "@/lib/replay-display";

/** Architecture comparison replay helpers (distinct from `/v1/authority/replay`). */

export function ArchitectureComparisonReplayCostSection() {
  const searchParams = useSearchParams();

  const [comparisonRecordId, setComparisonRecordId] = useState("");
  const [replayMode, setReplayMode] = useState<string>("");
  const [persistReplay, setPersistReplay] = useState(false);
  const [format, setFormat] = useState("");

  const [estimate, setEstimate] = useState<ComparisonReplayCostEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  useEffect(() => {
    const id = searchParams.get("comparisonRecordId");

    if (id != null && id.trim().length > 0) {
      setComparisonRecordId(id.trim());
    }

    const fmt = searchParams.get("comparisonFormat");

    if (fmt != null && fmt.trim().length > 0) {
      setFormat(fmt.trim());
    }
  }, [searchParams]);

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
    <section className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 mt-10 max-w-3xl p-4">
      <h3 className="mt-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
        Architecture comparison replay — estimated cost (warn-only)
      </h3>
      <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">
        Targets{" "}
        <span className="font-mono text-xs">GET /v1/architecture/comparisons/&lt;id&gt;/replay/cost-estimate</span> — distinct from the
        review replay POST above. Populate <span className="font-mono text-xs">comparisonRecordId</span> query on this route (optional{" "}
        <span className="font-mono text-xs">comparisonFormat</span>) to hydrate the ID field automatically.
      </p>

      <div className="mt-3 grid max-w-xl gap-3">
        <div className="space-y-2">
          <Label htmlFor="comparison-record-id-cost">Comparison record ID</Label>
          <Input
            id="comparison-record-id-cost"
            value={comparisonRecordId}
            placeholder="comparison record identifier"
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
            placeholder="leave blank unless your replay/export format narrows estimator inputs"
            onChange={(ev) => {
              setFormat(ev.target.value);
            }}
            autoComplete="off"
          />
        </div>

        <fieldset className="space-y-2 rounded-md border border-amber-200/80 bg-white/40 p-3 dark:border-amber-800 dark:bg-neutral-950/60">
          <legend className="px-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">Replay mode overlay (optional)</legend>
          <select
            className="max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
            value={replayMode}
            aria-label="Optional comparison replay mode sent to estimator"
            onChange={(e) => {
              setReplayMode(e.target.value);
            }}
          >
            <option value="">Estimator default</option>
            {REPLAY_MODE_PLAIN_OPTIONS.map((row) => (
              <option key={row.mode} value={row.mode}>
                {row.label}
              </option>
            ))}
          </select>
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            {replayMode.trim().length > 0
              ? replayModeLabel(replayMode)
              : "Only set this when parity with a heavyweight comparison replay POST calls for estimating with a richer mode overlay."}
          </p>
        </fieldset>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border border-neutral-300 text-teal-800 focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900"
            checked={persistReplay}
            onChange={(ev) => {
              setPersistReplay(ev.target.checked);
            }}
          />
          Estimate with persisted replay (if estimator supports flag)
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
          <p className="m-0 w-full text-xs text-neutral-600 dark:text-neutral-400">
            Estimates also refresh silently ~450ms after you stop typing.
          </p>
        </div>

        {failure !== null ? <OperatorApiProblem failure={failure} /> : null}

        {estimate !== null ? (
          <div className="rounded-md border border-amber-400/70 bg-white/80 px-3 py-2 dark:border-amber-600 dark:bg-neutral-950">
            <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Estimated band: <span className="font-semibold">{estimate.relativeCostBand}</span>{" "}
              {typeof estimate.approximateRelativeScore === "number" ? (
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  ({String(estimate.approximateRelativeScore)} / 100)
                </span>
              ) : null}
            </p>
            <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Comparison <span className="font-mono">{estimate.comparisonRecordId}</span> · type{" "}
              <span className="font-mono">{estimate.comparisonType}</span> · format <span className="font-mono">{estimate.format}</span>
            </p>

            {(estimate.factors?.length ?? 0) > 0 ? (
              <Fragment>
                <p className="m-0 mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">Signals</p>
                <ul className="m-0 list-disc space-y-1 pl-6 text-xs text-neutral-700 dark:text-neutral-300">
                  {(estimate.factors ?? []).map((factor, idx) => (
                    <li key={`${estimate.comparisonRecordId}-factor-${String(idx)}`}>{factor}</li>
                  ))}
                </ul>
              </Fragment>
            ) : null}
            <p className="m-0 mt-2 text-xs font-medium text-amber-950 dark:text-amber-50">
              Guidance only — not a hard block before any downstream replay/export job you trigger elsewhere from tooling.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
