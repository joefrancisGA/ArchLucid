"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { OperatorLoadingNotice, OperatorTryNext } from "@/components/OperatorShellMessage";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PlanningExportReadinessNote } from "@/components/planning/PlanningExportReadinessNote";
import { PlanningPlansTable } from "@/components/planning/PlanningPlansTable";
import { PlanningSummarySection } from "@/components/planning/PlanningSummarySection";
import { PlanningThemesTable } from "@/components/planning/PlanningThemesTable";
import { PLANNING_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import type { PlanningPageViewModel } from "./planning-page-view-model";

type Props = {
  readonly model: PlanningPageViewModel;
};

export function PlanningPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Planning"
        description="In a connected tenant, operators browse improvement themes and prioritized plans derived from adoption feedback."
      />
    );
  }

  return (
    <div className="max-w-5xl">
      <OperatorPageHeader title="Planning" />
      <p className={cn("max-w-3xl leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Improvement themes and prioritized plans derived from evaluation feedback. This is a <strong>read-only</strong> browse view — use{" "}
        <Link href="/product-learning" className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300">
          {OPERATOR_NAV_LINK_LABELS.pilotFeedback}
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
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Fetching summary, themes, and plans from the API…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.loading && m.summary !== null ? (
        <OperatorLoadingNotice>
          <strong>Refreshing planning data.</strong>
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Re-fetching summary, themes, and plans from the API…</p>
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
              {OPERATOR_NAV_LINK_LABELS.pilotFeedback}
            </Link>
            —this page is read-only aggregation.
          </OperatorTryNext>
        </div>
      ) : null}

      {m.empty && !m.loading ? (
        <>
          <EnterpriseCompactEmptyState {...PLANNING_EMPTY_COMPACT} />
          <OperatorTryNext>
            Capture or import evaluation feedback on{" "}
            <Link href="/product-learning" className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300">
              {OPERATOR_NAV_LINK_LABELS.pilotFeedback}
            </Link>
            , then return here after processing jobs have run.
          </OperatorTryNext>
        </>
      ) : null}

      {m.summary !== null ? (
        <>
          <PlanningSummarySection summary={m.summary} generatedUtc={m.generatedUtc} />

          <section className="mb-7" aria-labelledby="planning-themes-heading">
            <h3 id="planning-themes-heading" className={cn("mb-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Top improvement themes
            </h3>
            <p className={cn("mt-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
            <h3 id="planning-plans-heading" className={cn("mb-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Prioritized improvement plans
            </h3>
            <p className={cn("mt-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Ordered by priority score (highest first). Open a row for action steps and link-level evidence counts.
            </p>

            {m.selectedThemeId !== null ? (
              <div
                className={cn(
                  "mb-3 flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2.5 dark:border-neutral-800",
                  OPERATOR_TYPOGRAPHY.body,
                )}
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
