"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useState } from "react";

import { BeforeAfterDeltaInlinePanel } from "@/components/BeforeAfterDelta/BeforeAfterDeltaInlinePanel";
import { BeforeAfterDeltaSidebarPanel } from "@/components/BeforeAfterDelta/BeforeAfterDeltaSidebarPanel";
import { BeforeAfterDeltaTopPanel } from "@/components/BeforeAfterDelta/BeforeAfterDeltaTopPanel";
import { formatUsd } from "@/components/BeforeAfterDelta/formatDelta";
import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/**
 * Render variant for the BeforeAfterDeltaPanel:
 * - `cycle` (default): the original trial-onboarding "review-cycle delta" card —
 *   baseline (from `/v1/tenant/trial-status`) vs measured (from per-run pilot-run-deltas).
 *   This is the legacy callsite-compatible behavior; existing callers that omit
 *   `variant` keep working unchanged.
 * - `top`: aggregated median across the most recent N committed runs, rendered
 *   above the runs index list. Calls the new `/v1/pilots/runs/recent-deltas`
 *   aggregated endpoint (one HTTP call, server-computed medians).
 * - `sidebar`: same data as `top`, compact rendering for the sidebar widget slot.
 * - `inline`: single-run delta vs the prior committed run for the same architecture
 *   request (uses `runId` from props), rendered above the artifacts table on
 *   `/architecture/reviews/{runId}`.
 */
export type BeforeAfterDeltaPanelVariant = "cycle" | "top" | "sidebar" | "inline";

export type BeforeAfterDeltaPanelProps = {
  /**
   * When provided, the panel uses this run for the measured delta. When omitted, it uses
   * `trialWelcomeRunId` from `GET /v1/tenant/trial-status` so the operator dashboard can render the panel
   * without knowing the seeded run id at build time. Required for the `inline` variant.
   */
  runId?: string;

  /**
   * Render variant. Defaults to `cycle` (the original trial-onboarding behavior) so that
   * pre-existing callsites — `<BeforeAfterDeltaPanel />` and `<BeforeAfterDeltaPanel runId="..." />`
   * — keep their pixel-stable behavior without code changes.
   */
  variant?: BeforeAfterDeltaPanelVariant;

  /** Top / sidebar variants only — number of recent committed runs to aggregate (default 5; server clamps to [1, 25]). */
  count?: number;
};

type TrialStatusPayload = {
  trialWelcomeRunId?: string | null;
  baselineReviewCycleHours?: number | null;
  baselineReviewCycleSource?: string | null;
  baselineReviewCycleCapturedUtc?: string | null;
};

type PilotRunDeltasPayload = {
  timeToCommittedManifestTotalSeconds?: number | null;
  manifestCommittedUtc?: string | null;
  estimatedUsdSavings?: number | null;
};

type PanelData = {
  baselineHours: number | null;
  baselineSource: string | null;
  baselineCapturedUtc: string | null;
  measuredHours: number | null;
  estimatedUsdSavings: number | null;
  effectiveRunId: string | null;
  measuredAvailable: boolean;
};

const SECONDS_PER_HOUR = 3600;

function formatHours(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return "—";

  return hours.toFixed(2);
}

function computeDelta(baseline: number | null, measured: number | null): { hours: number; percent: number } | null {
  if (baseline === null || measured === null) return null;
  if (!Number.isFinite(baseline) || !Number.isFinite(measured)) return null;
  if (baseline <= 0) return null;

  const delta = baseline - measured;
  const percent = (delta / baseline) * 100;

  return { hours: delta, percent };
}

export function BeforeAfterDeltaPanel({ runId, variant, count }: BeforeAfterDeltaPanelProps) {
  if (variant === "top") return <BeforeAfterDeltaTopPanel count={count} />;
  if (variant === "sidebar") return <BeforeAfterDeltaSidebarPanel count={count} />;

  if (variant === "inline") {
    if (runId === undefined || runId === "") return null;

    return <BeforeAfterDeltaInlinePanel runId={runId} />;
  }

  return <BeforeAfterDeltaCyclePanel runId={runId} />;
}

function BeforeAfterDeltaCyclePanel({ runId }: { runId?: string }) {
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const { data: trialPayload, isFetched: trialFetched } = useTenantTrialStatusQuery({
    enabled: concernFetchEnabled,
  });
  const [state, setState] = useState<{ status: "loading" | "ready" | "error" | "skipped"; data: PanelData | null }>({
    status: "loading",
    data: null,
  });

  useEffect(() => {
    if (!trialFetched) {
      return;
    }

    let canceled = false;

    async function load(trial: TrialStatusPayload | null): Promise<void> {
      try {
        const baselineHours =
          typeof trial?.baselineReviewCycleHours === "number" && Number.isFinite(trial.baselineReviewCycleHours)
            ? trial.baselineReviewCycleHours
            : null;
        const baselineSource = typeof trial?.baselineReviewCycleSource === "string" ? trial.baselineReviewCycleSource : null;
        const baselineCapturedUtc =
          typeof trial?.baselineReviewCycleCapturedUtc === "string" ? trial.baselineReviewCycleCapturedUtc : null;

        const effectiveRunId = (runId ?? trial?.trialWelcomeRunId) || null;

        if (effectiveRunId === null) {
          if (!canceled) {
            setState({
              status: "ready",
              data: {
                baselineHours,
                baselineSource,
                baselineCapturedUtc,
                measuredHours: null,
                estimatedUsdSavings: null,
                effectiveRunId: null,
                measuredAvailable: false,
              },
            });
          }

          return;
        }

        const deltasRes = await fetch(
          `/api/proxy/v1/pilots/runs/${encodeURIComponent(effectiveRunId)}/pilot-run-deltas`,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        let measuredHours: number | null = null;
        let measuredAvailable = false;
        let estimatedUsdSavings: number | null = null;

        if (deltasRes.ok) {
          const deltas = (await deltasRes.json()) as PilotRunDeltasPayload;
          const seconds = deltas.timeToCommittedManifestTotalSeconds;

          if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
            measuredHours = seconds / SECONDS_PER_HOUR;
            measuredAvailable = true;
          }

          if (typeof deltas.estimatedUsdSavings === "number" && Number.isFinite(deltas.estimatedUsdSavings)) {
            estimatedUsdSavings = deltas.estimatedUsdSavings;
          }
        }

        if (canceled) return;

        setState({
          status: "ready",
          data: {
            baselineHours,
            baselineSource,
            baselineCapturedUtc,
            measuredHours,
            estimatedUsdSavings,
            effectiveRunId,
            measuredAvailable,
          },
        });
      } catch {
        if (!canceled) setState({ status: "error", data: null });
      }
    }

    void load(trialPayload ?? null);

    return () => {
      canceled = true;
    };
  }, [runId, trialFetched, trialPayload]);

  if (state.status === "loading" || state.status === "skipped" || state.status === "error") return null;

  const data = state.data;

  if (data === null) return null;

  if (data.baselineHours === null && !data.measuredAvailable && data.estimatedUsdSavings === null) return null;

  const delta = computeDelta(data.baselineHours, data.measuredHours);

  return (
    <section
      data-testid="before-after-delta-panel"
      role="region"
      aria-label="Review-cycle delta before vs measured"
      className="mb-6 max-w-3xl rounded-md border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        Review-cycle delta (before vs measured)
      </h3>
      <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Compares your estimated baseline review cycle time against measured time for finalized reviews in this
        workspace. Estimated savings use accepted cost findings from committed review activity.
      </p>

      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
          <dt className={cn("font-medium uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Baseline (before)</dt>
          <dd
            data-testid="before-after-delta-baseline-hours"
            className={cn("mt-1 font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}
          >
            {formatHours(data.baselineHours)} h
          </dd>
          <dd className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {data.baselineHours === null
              ? "Not provided at signup — using a measured anchor only."
              : data.baselineSource
                ? `Source: ${data.baselineSource}`
                : "Tenant-supplied at trial signup."}
          </dd>
        </div>
        <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
          <dt className={cn("font-medium uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Measured (this review)</dt>
          <dd
            data-testid="before-after-delta-measured-hours"
            className={cn("mt-1 font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}
          >
            {formatHours(data.measuredHours)} h
          </dd>
          <dd className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {data.measuredAvailable
              ? "Measured from committed review activity in this workspace."
              : "Awaiting first finalized review to populate the measurement."}
          </dd>
        </div>
        <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
          <dt className={cn("font-medium uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Estimated USD savings</dt>
          <dd
            data-testid="before-after-delta-estimated-usd-savings"
            className={cn("mt-1 font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}
          >
            {formatUsd(data.estimatedUsdSavings)}
          </dd>
          <dd className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Sum of accepted Cost-category findings from the run findings snapshot.
          </dd>
        </div>
      </dl>

      {delta !== null ? (
        <p
          data-testid="before-after-delta-summary"
          className={cn("rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 mt-3 px-3 py-2 font-medium", OPERATOR_TYPOGRAPHY.body)}
        >
          {delta.hours >= 0
            ? `Delta: ${delta.hours.toFixed(2)} h saved per finalized review (${delta.percent.toFixed(1)}% improvement)`
            : `Delta: measured review took ${Math.abs(delta.hours).toFixed(2)} h longer than the supplied baseline`}
        </p>
      ) : null}
    </section>
  );
}
