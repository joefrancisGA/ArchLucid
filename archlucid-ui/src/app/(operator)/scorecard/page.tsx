"use client";

import { useCallback, useEffect, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";

type ScorecardJson = {
  tenantId: string;
  totalRunsCommitted: number;
  totalManifestsCreated: number;
  totalFindingsResolved: number;
  averageTimeToManifestMinutes: number | null;
  totalAuditEventsGenerated: number;
  totalGovernanceApprovalsCompleted: number;
  firstCommitUtc: string | null;
  daysSinceFirstCommit: number | null;
  metricSources?: Record<string, string>;
  baselines: {
    baselineHoursPerReview: number | null;
    baselineReviewsPerQuarter: number | null;
    baselineArchitectHourlyCost: number | null;
    updatedUtc: string;
  } | null;
  roiEstimate: {
    annualReviewCostStatusQuoUsd: number;
    annualReviewSavingsFromReviewTimeLeverUsd: number;
    modelReference: string;
    currency: string;
  } | null;
};

function MetricCard(props: { title: string; value: string; hint?: string; provenance?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{props.title}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
        {props.value}
      </p>
      {props.hint ? (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{props.hint}</p>
      ) : null}
      {props.provenance ? (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Source: {props.provenance}
        </p>
      ) : null}
    </div>
  );
}

export default function PilotScorecardPage() {
  const canExecute = useOperateCapability();
  const [data, setData] = useState<ScorecardJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState("");
  const [reviews, setReviews] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/proxy/v1/pilots/scorecard", { headers: { Accept: "application/json" } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as ScorecardJson;
      setData(json);
      if (json.baselines) {
        setHours(json.baselines.baselineHoursPerReview?.toString() ?? "");
        setReviews(json.baselines.baselineReviewsPerQuarter?.toString() ?? "");
        setRate(json.baselines.baselineArchitectHourlyCost?.toString() ?? "");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load scorecard.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSaveBaselines = async () => {
    if (!canExecute) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        baselineHoursPerReview: hours.trim() === "" ? null : Number(hours),
        baselineReviewsPerQuarter: reviews.trim() === "" ? null : Number.parseInt(reviews, 10),
        baselineArchitectHourlyCost: rate.trim() === "" ? null : Number(rate),
      };
      const res = await fetch("/api/proxy/v1/pilots/scorecard/baselines", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Pilot scorecard</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">
          Cumulative tenant metrics from committed runs, durable baselines for ROI modeling (
          <span className="font-mono">docs/go-to-market/ROI_MODEL.md</span>), and estimated review-time savings when
          baselines are complete.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {error}
        </div>
      ) : null}

      {data === null && !error ? <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p> : null}

      {data ? (
        <>
          <section aria-labelledby="scorecard-metrics">
            <h2 id="scorecard-metrics" className="mb-3 text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Operational metrics
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Runs committed" value={String(data.totalRunsCommitted)} provenance={data.metricSources?.totalRunsCommitted} />
              <MetricCard title="Manifests created" value={String(data.totalManifestsCreated)} provenance={data.metricSources?.totalManifestsCreated} />
              <MetricCard
                title="Findings affirmed"
                value={String(data.totalFindingsResolved)}
                hint="FindingFeedback score +1 (tenant scope)"
                provenance={data.metricSources?.totalFindingsResolved}
              />
              <MetricCard
                title="Avg. time to manifest"
                value={
                  data.averageTimeToManifestMinutes === null ? "—" : `${data.averageTimeToManifestMinutes.toFixed(1)} min`
                }
                provenance={data.metricSources?.averageTimeToManifestMinutes}
              />
              <MetricCard title="Audit events" value={String(data.totalAuditEventsGenerated)} provenance={data.metricSources?.totalAuditEventsGenerated} />
              <MetricCard
                title="Governance approvals completed"
                value={String(data.totalGovernanceApprovalsCompleted)}
                provenance={data.metricSources?.totalGovernanceApprovalsCompleted}
              />
              <MetricCard
                title="First commit (UTC)"
                value={data.firstCommitUtc ? new Date(data.firstCommitUtc).toISOString().slice(0, 19) + "Z" : "—"}
                provenance={data.metricSources?.firstCommitUtc}
              />
              <MetricCard
                title="Days since first commit"
                value={data.daysSinceFirstCommit === null ? "—" : String(data.daysSinceFirstCommit)}
                provenance={data.metricSources?.daysSinceFirstCommit}
              />
            </div>
          </section>

          <section
            aria-labelledby="roi-baselines"
            className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h2 id="roi-baselines" className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              ROI baselines
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Maps to ROI model inputs (hours per review, reviews per quarter, architect hourly cost). Leave fields empty
              for a null baseline; GET still returns metrics with <code className="font-mono">roiEstimate: null</code>.
            </p>
            <div className="mt-4 grid max-w-lg gap-3">
              <label className="block text-sm">
                <span className="text-neutral-700 dark:text-neutral-200">Hours per review</span>
                <input
                  className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-950"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  inputMode="decimal"
                  disabled={!canExecute || saving}
                />
              </label>
              <label className="block text-sm">
                <span className="text-neutral-700 dark:text-neutral-200">Reviews per quarter</span>
                <input
                  className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-950"
                  value={reviews}
                  onChange={(e) => setReviews(e.target.value)}
                  inputMode="numeric"
                  disabled={!canExecute || saving}
                />
              </label>
              <label className="block text-sm">
                <span className="text-neutral-700 dark:text-neutral-200">Architect hourly cost (USD)</span>
                <input
                  className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-950"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  inputMode="decimal"
                  disabled={!canExecute || saving}
                />
              </label>
              <button
                type="button"
                onClick={() => void onSaveBaselines()}
                disabled={!canExecute || saving}
                className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
              >
                {saving ? "Saving…" : "Save baselines"}
              </button>
              {!canExecute ? (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Sign in with an Execute-capable role to update baselines (API <span className="font-mono">PUT …/baselines</span>
                  ).
                </p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="roi-estimate">
            <h2 id="roi-estimate" className="mb-3 text-lg font-medium text-neutral-900 dark:text-neutral-100">
              ROI estimate (review time lever)
            </h2>
            {data.roiEstimate ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  title="Status quo — annual review labor"
                  value={`$${data.roiEstimate.annualReviewCostStatusQuoUsd.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                />
                <MetricCard
                  title="Estimated annual savings (50% review hours)"
                  value={`$${data.roiEstimate.annualReviewSavingsFromReviewTimeLeverUsd.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                />
                <p className="sm:col-span-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Model: {data.roiEstimate.modelReference} · Currency: {data.roiEstimate.currency}
                </p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No ROI estimate until all three baselines are set to positive values.
              </p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
