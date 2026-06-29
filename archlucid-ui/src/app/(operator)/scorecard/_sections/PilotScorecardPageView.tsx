"use client";
import { cn } from "@/lib/utils";

import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
    resolvedAnnualSavingsLabel,
    resolvedStatusQuoCostLabel,
    reviews,
    saving,
    setHours,
    setRate,
    setReviews,
  } = model;

  return (
    <div className="w-full max-w-[1440px] space-y-8 px-4 py-8">
      <ValueReportOutcomesNav />
      <header>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{BUYER_TERMINOLOGY.reviewScorecard}</h1>
        <p className={cn("mt-2 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>
          Cumulative tenant metrics from committed reviews, durable baselines for ROI modeling (
          <span className="font-mono">docs/go-to-market/ROI_MODEL.md</span>), and estimated review-time savings when
          baselines are complete.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {error}
        </div>
      ) : null}

      {data === null && !error ? <p className={OPERATOR_TYPOGRAPHY.helper}>Loading…</p> : null}

      {data ? (
        <>
          <section aria-labelledby="scorecard-metrics">
            <h2 id="scorecard-metrics" className={cn("mb-3", OPERATOR_NAV_GROUP_LABEL)}>
              Operational metrics
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ScorecardMetricCard title="Reviews committed" value={String(data.totalRunsCommitted)} provenance={data.metricSources?.totalRunsCommitted} />
              <ScorecardMetricCard title="Review packages finalized" value={String(data.totalManifestsCreated)} provenance={data.metricSources?.totalManifestsCreated} />
              <ScorecardMetricCard
                title="Findings affirmed"
                value={String(data.totalFindingsResolved)}
                hint="FindingFeedback score +1 (tenant scope)"
                provenance={data.metricSources?.totalFindingsResolved}
              />
              <ScorecardMetricCard
                title="Avg. time to finalized review package"
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
            <h2 id="roi-baselines" className={OPERATOR_NAV_GROUP_LABEL}>
              ROI baselines
            </h2>
            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
              Maps to ROI model inputs (hours per review, reviews per quarter, architect hourly cost). Leave fields empty
              for a null baseline; GET still returns metrics with <code className="font-mono">roiEstimate: null</code>.
            </p>
            <div className="mt-4 grid max-w-lg gap-3">
              <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                <span className="text-al-text-primary">Hours per review</span>
                <input
                  className={cn(
                    "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 font-mono dark:border-neutral-600 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  inputMode="decimal"
                  disabled={!canExecute || saving}
                />
              </label>
              <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                <span className="text-al-text-primary">Reviews per quarter</span>
                <input
                  className={cn(
                    "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 font-mono dark:border-neutral-600 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  value={reviews}
                  onChange={(e) => setReviews(e.target.value)}
                  inputMode="numeric"
                  disabled={!canExecute || saving}
                />
              </label>
              <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                <span className="text-al-text-primary">Architect hourly cost (USD)</span>
                <input
                  className={cn(
                    "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 font-mono dark:border-neutral-600 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
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
                className={cn(
                  "rounded bg-neutral-900 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900",
                  OPERATOR_TYPOGRAPHY.button,
                )}
              >
                {saving ? "Saving…" : "Save baselines"}
              </button>
              {!canExecute ? (
                <p className={OPERATOR_TYPOGRAPHY.helper}>
                  Sign in with an Execute-capable role to update baselines (API <span className="font-mono">PUT …/baselines</span>
                  ).
                </p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="roi-estimate">
            <h2 id="roi-estimate" className={cn("mb-3", OPERATOR_NAV_GROUP_LABEL)}>
              ROI estimate (review time lever)
            </h2>
            {data.roiEstimate ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <ScorecardMetricCard
                  title="Status quo — annual review labor"
                  value={resolvedStatusQuoCostLabel ?? "—"}
                />
                <ScorecardMetricCard
                  title="Estimated annual savings (50% review hours)"
                  value={resolvedAnnualSavingsLabel ?? "—"}
                />
                <p className={cn("sm:col-span-2", OPERATOR_TYPOGRAPHY.helper)}>
                  Model: {data.roiEstimate.modelReference} · Currency: {data.roiEstimate.currency}
                </p>
              </div>
            ) : (
              <p className={OPERATOR_TYPOGRAPHY.helper}>
                No ROI estimate until all three baselines are set to positive values.
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
