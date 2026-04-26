"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PlanningExportReadinessNote } from "@/components/planning/PlanningExportReadinessNote";
import { PlanningPlansTable } from "@/components/planning/PlanningPlansTable";
import { PlanningSummarySection } from "@/components/planning/PlanningSummarySection";
import { PlanningThemesTable } from "@/components/planning/PlanningThemesTable";
import { EmptyState } from "@/components/EmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice, OperatorTryNext } from "@/components/OperatorShellMessage";
import { PLANNING_EMPTY } from "@/lib/empty-state-presets";
import { fetchLearningPlanningListBundle } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { sortPlansForPlanningDisplay, sortThemesForPlanningDisplay } from "@/lib/planning-display-order";
import type { LearningPlanListItemResponse, LearningThemeResponse } from "@/types/learning";

/**
 * 59R planning list: top themes, prioritized plans, and evidence-style counts (read-only browsing).
 */
export default function PlanningPage() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchLearningPlanningListBundle>>["summary"] | null>(
    null,
  );
  const [themes, setThemes] = useState<LearningThemeResponse[]>([]);
  const [plans, setPlans] = useState<LearningPlanListItemResponse[]>([]);
  const [generatedUtc, setGeneratedUtc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const bundle = await fetchLearningPlanningListBundle({ maxThemes: 50, maxPlans: 50 });
      setSummary(bundle.summary);
      setThemes(bundle.themes.themes);
      setPlans(bundle.plans.plans);
      setGeneratedUtc(bundle.summary.generatedUtc);
      setSelectedThemeId((prev) => {
        if (prev === null) {
          return null;
        }

        const stillThere = bundle.themes.themes.some((t) => t.themeId === prev);

        return stillThere ? prev : null;
      });
    } catch (e) {
      setFailure(toApiLoadFailure(e));
      setSummary(null);
      setThemes([]);
      setPlans([]);
      setGeneratedUtc(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedThemes = useMemo(() => sortThemesForPlanningDisplay(themes), [themes]);
  const sortedPlans = useMemo(() => sortPlansForPlanningDisplay(plans), [plans]);

  const themeTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of themes) {
      m.set(t.themeId, t.title);
    }

    return m;
  }, [themes]);

  const visiblePlans = useMemo(() => {
    if (selectedThemeId === null) {
      return sortedPlans;
    }

    return sortedPlans.filter((p) => p.themeId === selectedThemeId);
  }, [sortedPlans, selectedThemeId]);

  const selectedThemeTitle =
    selectedThemeId !== null ? themeTitleById.get(selectedThemeId) ?? selectedThemeId : null;

  const empty = summary !== null && summary.themeCount === 0 && summary.planCount === 0;

  return (
    <main className="max-w-5xl">
      <OperatorPageHeader title="Planning" />
      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-3xl">
        Improvement themes and prioritized plans derived from pilot feedback (59R). This is a{" "}
        <strong>read-only</strong> browse view — use{" "}
        <Link href="/product-learning" className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300">
          Pilot feedback
        </Link>{" "}
        for rollups and triage export.
      </p>

      <div className="flex flex-wrap gap-3 items-center mt-4 mb-5">
        <button type="button" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && summary === null ? (
        <OperatorLoadingNotice>
          <strong>Loading planning data.</strong>
          <p className="mt-2 text-sm">Fetching summary, themes, and plans from the API…</p>
        </OperatorLoadingNotice>
      ) : null}

      {loading && summary !== null ? (
        <OperatorLoadingNotice>
          <strong>Refreshing planning data.</strong>
          <p className="mt-2 text-sm">Re-fetching summary, themes, and plans from the API…</p>
        </OperatorLoadingNotice>
      ) : null}

      {failure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
          <OperatorTryNext>
            Confirm learning/planning API routes are enabled for this environment, then click <strong>Refresh</strong>.
            For data entry and triage, use{" "}
            <Link href="/product-learning" className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300">
              Pilot feedback
            </Link>
            —this page is read-only aggregation.
          </OperatorTryNext>
        </div>
      ) : null}

      {empty && !loading ? (
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

      {summary !== null ? (
        <>
          <PlanningSummarySection summary={summary} generatedUtc={generatedUtc} />

          <section className="mb-7" aria-labelledby="planning-themes-heading">
            <h3 id="planning-themes-heading" className="text-[17px] mb-1">
              Top improvement themes
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-[13px] mt-0">
              Ordered by evidence signal count, then distinct runs. Use <strong>Plans</strong> to narrow the plan list
              to one theme.
            </p>
            <PlanningThemesTable
              themes={sortedThemes}
              plans={sortedPlans}
              selectedThemeId={selectedThemeId}
              onSelectThemeForPlans={(id) => setSelectedThemeId(id)}
            />
          </section>

          <section className="mb-6" aria-labelledby="planning-plans-heading">
            <h3 id="planning-plans-heading" className="text-[17px] mb-1">
              Prioritized improvement plans
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-[13px] mt-0">
              Ordered by priority score (highest first). Open a row for action steps and link-level evidence counts.
            </p>

            {selectedThemeId !== null ? (
              <div className="flex flex-wrap items-center gap-3 py-2.5 px-3 mb-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm" role="status">
                <span>
                  Showing plans for theme: <strong>{selectedThemeTitle}</strong> ({visiblePlans.length} of{" "}
                  {sortedPlans.length})
                </span>
                <button type="button" onClick={() => setSelectedThemeId(null)}>
                  Show all plans
                </button>
              </div>
            ) : null}

            <PlanningPlansTable plans={visiblePlans} themeTitleById={themeTitleById} />
          </section>

          <PlanningExportReadinessNote />
        </>
      ) : null}
    </main>
  );
}
