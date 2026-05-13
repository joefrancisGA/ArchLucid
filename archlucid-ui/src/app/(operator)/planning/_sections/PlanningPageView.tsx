"use client";

import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { OperatorLoadingNotice, OperatorTryNext } from "@/components/OperatorShellMessage";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PlanningExportReadinessNote } from "@/components/planning/PlanningExportReadinessNote";
import { PlanningPlansTable } from "@/components/planning/PlanningPlansTable";
import { PlanningSummarySection } from "@/components/planning/PlanningSummarySection";
import { PlanningThemesTable } from "@/components/planning/PlanningThemesTable";
import { PLANNING_EMPTY } from "@/lib/empty-state-presets";

import type { PlanningPageViewModel } from "./planning-page-view-model";

type Props = {
  readonly model: PlanningPageViewModel;
};

export function PlanningPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Planning not available in demo mode.</p>
        <p className="m-0 mt-1">59R planning themes and prioritized plans require a live API connection.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <OperatorPageHeader title="Planning" />
      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-3xl">
        Improvement themes and prioritized plans derived from pilot feedback (59R). This is a <strong>read-only</strong> browse view — use{" "}
        <Link href="/product-learning" className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300">
          Pilot feedback
        </Link>{" "}
        for rollups and triage export.
      </p>

      {m.usedPlanningDemoFallback ? (
        <div className="mt-4 max-w-3xl">
          <OperatorDemoStaticBanner />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 items-center mt-4 mb-5">
        <button type="button" onClick={() => void m.load()} disabled={m.loading}>
          Refresh
        </button>
      </div>

      {m.loading && m.summary === null ? (
        <OperatorLoadingNotice>
          <strong>Loading planning data.</strong>
          <p className="mt-2 text-sm">Fetching summary, themes, and plans from the API…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.loading && m.summary !== null ? (
        <OperatorLoadingNotice>
          <strong>Refreshing planning data.</strong>
          <p className="mt-2 text-sm">Re-fetching summary, themes, and plans from the API…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.failure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
          <OperatorTryNext>
            Confirm learning/planning API routes are enabled for this environment, then click <strong>Refresh</strong>. For data entry and triage, use{" "}
            <Link href="/product-learning" className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300">
              Pilot feedback
            </Link>
            —this page is read-only aggregation.
          </OperatorTryNext>
        </div>
      ) : null}

      {m.empty && !m.loading ? (
        <>
          <EmptyState {...PLANNING_EMPTY} />
          <OperatorTryNext>
            Capture or import pilot feedback on{" "}
            <Link href="/product-learning" className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300">
              Pilot feedback
            </Link>
            , then return here after processing jobs have run.
          </OperatorTryNext>
        </>
      ) : null}

      {m.summary !== null ? (
        <>
          <PlanningSummarySection summary={m.summary} generatedUtc={m.generatedUtc} />

          <section className="mb-7" aria-labelledby="planning-themes-heading">
            <h3 id="planning-themes-heading" className="text-[17px] mb-1">
              Top improvement themes
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-[13px] mt-0">
              Ordered by evidence signal count, then distinct runs. Use <strong>Plans</strong> to narrow the plan list to one theme.
            </p>
            <PlanningThemesTable
              themes={m.sortedThemes}
              plans={m.sortedPlans}
              selectedThemeId={m.selectedThemeId}
              onSelectThemeForPlans={(id) => m.setSelectedThemeId(id)}
            />
          </section>

          <section className="mb-6" aria-labelledby="planning-plans-heading">
            <h3 id="planning-plans-heading" className="text-[17px] mb-1">
              Prioritized improvement plans
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-[13px] mt-0">
              Ordered by priority score (highest first). Open a row for action steps and link-level evidence counts.
            </p>

            {m.selectedThemeId !== null ? (
              <div
                className="flex flex-wrap items-center gap-3 py-2.5 px-3 mb-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm"
                role="status"
              >
                <span>
                  Showing plans for theme: <strong>{m.selectedThemeTitle}</strong> ({m.visiblePlans.length} of {m.sortedPlans.length})
                </span>
                <button type="button" onClick={() => m.setSelectedThemeId(null)}>
                  Show all plans
                </button>
              </div>
            ) : null}

            <PlanningPlansTable plans={m.visiblePlans} themeTitleById={m.themeTitleById} />
          </section>

          <PlanningExportReadinessNote />
        </>
      ) : null}
    </div>
  );
}
