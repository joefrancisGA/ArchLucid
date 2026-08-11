"use client";

import { cn } from "@/lib/utils";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import {
  OperatorLoadingNotice,
  OperatorTryNext,
} from "@/components/OperatorShellMessage";
import { PlanningExportReadinessNote } from "@/components/planning/PlanningExportReadinessNote";
import { PlanningPlansTable } from "@/components/planning/PlanningPlansTable";
import { PlanningSummarySection } from "@/components/planning/PlanningSummarySection";
import { PlanningThemesTable } from "@/components/planning/PlanningThemesTable";
import { PlanningReviewsVocabularyRail } from "@/components/PlanningReviewsVocabularyRail";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN } from "@/lib/planning-empty-orientation-copy";
import {
  IMPROVEMENT_PLANNING_DEMO_DESCRIPTION,
  IMPROVEMENT_PLANNING_FAILURE_TRY_NEXT,
  IMPROVEMENT_PLANNING_PAGE_TITLE,
  IMPROVEMENT_PLANNING_PRODUCT_SAFE_INTRO,
  IMPROVEMENT_PLANNING_SCOPE_LINE,
  IMPROVEMENT_PLANNING_TECHNICAL_SCOPE_BODY,
  IMPROVEMENT_PLANNING_TECHNICAL_SCOPE_TITLE,
  planningPageSubtitle,
} from "@/lib/planning-page-copy";
import { PlanningPageEmptyState } from "./PlanningPageEmptyState";
import { PlanningPageHeader } from "./PlanningPageHeader";
import type { PlanningPageViewModel } from "./planning-page-view-model";

type Props = {
  readonly model: PlanningPageViewModel;
};

export function PlanningPageView(props: Props) {
  const m = props.model;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability={IMPROVEMENT_PLANNING_PAGE_TITLE}
        description={IMPROVEMENT_PLANNING_DEMO_DESCRIPTION}
      />
    );
  }

  return (
    <div className="max-w-5xl">
      <PlanningPageHeader
        subtitle={planningPageSubtitle(buyerPolishedShell)}
        refreshing={m.refreshing}
        generatedUtc={m.generatedUtc}
        onRefresh={() => {
          void m.load();
        }}
      />

      <PlanningReviewsVocabularyRail currentSurfaceId="improvement-planning" />

      {!buyerPolishedShell ? (
        <>
          <p className={cn("max-w-3xl leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {IMPROVEMENT_PLANNING_PRODUCT_SAFE_INTRO}
          </p>

          <p className={cn("mt-3 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {IMPROVEMENT_PLANNING_SCOPE_LINE}
          </p>

          <CollapsibleSection
            title={IMPROVEMENT_PLANNING_TECHNICAL_SCOPE_TITLE}
            defaultOpen={false}
            sectionTestId="planning-technical-scope-details"
          >
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{IMPROVEMENT_PLANNING_TECHNICAL_SCOPE_BODY}</p>
          </CollapsibleSection>
        </>
      ) : (
        <p className={cn("max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {IMPROVEMENT_PLANNING_SCOPE_LINE}
        </p>
      )}

      {m.usedPlanningDemoFallback ? (
        <div className="mt-4 max-w-3xl">
          <OperatorDemoStaticBanner />
        </div>
      ) : null}

      {m.loading && m.summary === null ? (
        <OperatorLoadingNotice>
          <strong>Loading planning insights.</strong>
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Fetching themes, plans, and summary metrics…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.refreshing && m.summary !== null ? (
        <OperatorLoadingNotice>
          <strong>Refreshing planning insights.</strong>
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Updating themes, plans, and summary metrics…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.failure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
          <OperatorTryNext>{IMPROVEMENT_PLANNING_FAILURE_TRY_NEXT}</OperatorTryNext>
        </div>
      ) : null}

      {m.empty && !m.loading && !m.refreshing ? <PlanningPageEmptyState /> : null}

      {/* Empty path keeps CTA + orientation only — hide zero KPIs, empty shells, and export. */}
      {m.summary !== null && !m.empty ? (
        <>
          <PlanningSummarySection summary={m.summary} generatedUtc={m.generatedUtc} />

          <section className="mb-7" aria-labelledby="planning-themes-heading">
            <h3 id="planning-themes-heading" className={cn("mb-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Top improvement themes
            </h3>
            <p className={cn("mt-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Recurring feedback patterns ranked by captured signals. Select a theme to focus the plan list below.
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
              Action plans ranked by priority score. Open a plan for steps, owners, and supporting evidence.
            </p>
            <p
              className={cn("mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="planning-priority-explain"
            >
              {IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN}
            </p>

            {m.selectedThemeId !== null ? (
              <div
                className={cn(
                  "mb-3 mt-3 flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2.5 dark:border-neutral-800",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                role="status"
              >
                <span>
                  Showing plans for theme: <strong>{m.selectedThemeTitle}</strong> ({m.visiblePlans.length} of{" "}
                  {m.sortedPlans.length})
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => m.setSelectedThemeId(null)}>
                  Show all plans
                </Button>
              </div>
            ) : null}

            <div className={m.selectedThemeId === null ? "mt-3" : undefined}>
              <PlanningPlansTable plans={m.visiblePlans} themeTitleById={m.themeTitleById} />
            </div>
          </section>

          <PlanningExportReadinessNote />
        </>
      ) : null}
    </div>
  );
}
