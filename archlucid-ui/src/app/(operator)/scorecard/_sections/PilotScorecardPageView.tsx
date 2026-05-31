"use client";

import { ScorecardMetricCard } from "./ScorecardMetricCard";
import type { UsePilotScorecardPageModel } from "./use-pilot-scorecard-page";

type PilotScorecardPageViewProps = {
  model: UsePilotScorecardPageModel;
};

export function PilotScorecardPageView({ model }: PilotScorecardPageViewProps) {
  const {
    canExecute,
    data,
    error,
    hours,
    onSaveBaselines,
    rate,
    reviews,
    saving,
    setHours,
    setRate,
    setReviews,
  } = model;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
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
          className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 px-3 py-2 text-sm"
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
              <ScorecardMetricCard title="Reviews committed" value={String(data.totalRunsCommitted)} provenance={data.metricSources?.totalRunsCommitted} />
              <ScorecardMetricCard title="Manifests created" value={String(data.totalManifestsCreated)} provenance={data.metricSources?.totalManifestsCreated} />
              <ScorecardMetricCard
                title="Findings affirmed"
                value={String(data.totalFindingsResolved)}
                hint="FindingFeedback score +1 (tenant scope)"
                provenance={data.metricSources?.totalFindingsResolved}
              />
              <ScorecardMetricCard
                title="Avg. time to manifest"
                value={
                  data.averageTimeToManifestMinutes === null ? "—" : `${data.averageTimeToManifestMinutes.toFixed(1)} min`
                }
                provenance={data.metricSources?.averageTimeToManifestMinutes}
              />
              <ScorecardMetricCard title="Audit events" value={String(data.totalAuditEventsGenerated)} provenance={data.metricSources?.totalAuditEventsGenerated} />
              <ScorecardMetricCard
                title="Governance approvals completed"
                value={String(data.totalGovernanceApprovalsCompleted)}
                provenance={data.metricSources?.totalGovernanceApprovalsCompleted}
              />
              <ScorecardMetricCard
                title="First commit (UTC)"
                value={data.firstCommitUtc ? new Date(data.firstCommitUtc).toISOString().slice(0, 19) + "Z" : "—"}
                provenance={data.metricSources?.firstCommitUtc}
              />
              <ScorecardMetricCard
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
                <ScorecardMetricCard
                  title="Status quo — annual review labor"
                  value={`$${data.roiEstimate.annualReviewCostStatusQuoUsd.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                />
                <ScorecardMetricCard
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
    </div>
  );
}
