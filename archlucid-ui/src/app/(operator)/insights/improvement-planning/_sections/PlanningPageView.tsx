"use client";

import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { OperatorEvidenceLimitsFooter } from "@/components/operator/OperatorEvidenceLimitsFooter";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { PlanningExportReadinessNote } from "@/components/planning/PlanningExportReadinessNote";
import { PlanningPlansTable } from "@/components/planning/PlanningPlansTable";
import { PlanningSummarySection } from "@/components/planning/PlanningSummarySection";
import { PlanningThemesTable } from "@/components/planning/PlanningThemesTable";
import { PlanningPlanDetailHubVocabularyRail } from "@/components/PlanningPlanDetailHubVocabularyRail";
import { PlanningReviewsVocabularyRail } from "@/components/PlanningReviewsVocabularyRail";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN } from "@/lib/planning-empty-orientation-copy";
import {
  IMPROVEMENT_PLANNING_DEMO_DESCRIPTION,
  IMPROVEMENT_PLANNING_LOAD_RETRY_LABEL,
  IMPROVEMENT_PLANNING_PAGE_TITLE,
  IMPROVEMENT_PLANNING_PRODUCT_SAFE_INTRO,
  IMPROVEMENT_PLANNING_SCOPE_LINE,
  IMPROVEMENT_PLANNING_SHOW_ALL_PLANS,
  IMPROVEMENT_PLANNING_TECHNICAL_SCOPE_BODY,
  IMPROVEMENT_PLANNING_TECHNICAL_SCOPE_TITLE,
  IMPROVEMENT_PLANNING_THEME_FILTER_NO_MATCH_BODY,
  IMPROVEMENT_PLANNING_THEME_FILTER_NO_MATCH_TITLE,
  planningPageSubtitle,
} from "@/lib/planning-page-copy";
import {
  readPlanningPickedReviewId,
  writePlanningPickedReviewId,
} from "@/lib/planning-picked-review-storage";
import { resolveContinueLastPlanningPlan } from "@/lib/resolve-continue-last-planning-plan";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { PlanningBuyerChrome } from "./PlanningBuyerChrome";
import { PlanningContinueLastPlanRow } from "./PlanningContinueLastPlanRow";
import { PlanningNextReviewFooterClient } from "./PlanningNextReviewFooterClient";
import { PlanningPickReviewBeforePlanningStrip } from "./PlanningPickReviewBeforePlanningStrip";
import { PlanningPageEmptyState } from "./PlanningPageEmptyState";
import { PlanningLoadFailurePanel } from "./PlanningLoadFailurePanel";
import { PlanningPageHeader } from "./PlanningPageHeader";
import { PlanningTablesSkeleton } from "./PlanningTablesSkeleton";
import type { PlanningPageViewModel } from "./planning-page-view-model";

type Props = {
  readonly model: PlanningPageViewModel;
};

export function PlanningPageView(props: Props) {
  const m = props.model;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const continueLastPlan = resolveContinueLastPlanningPlan(m.sortedPlans);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const showTablesSkeleton = m.refreshing && m.summary !== null && !m.empty;
  const showThemeFilterNoMatch =
    m.selectedThemeId !== null &&
    m.visiblePlans.length === 0 &&
    m.sortedPlans.length > 0 &&
    !m.loading &&
    !m.refreshing &&
    m.summary !== null &&
    !m.empty;

  useEffect(() => {
    setSelectedReviewId(readPlanningPickedReviewId());
  }, []);

  const onSelectReview = useCallback((reviewId: string) => {
    const trimmed = reviewId.trim();
    setSelectedReviewId(trimmed);
    writePlanningPickedReviewId(trimmed);
  }, []);

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability={IMPROVEMENT_PLANNING_PAGE_TITLE}
        description={IMPROVEMENT_PLANNING_DEMO_DESCRIPTION}
      />
    );
  }

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack}>
      <PlanningPageHeader
        subtitle={planningPageSubtitle(buyerPolishedShell)}
        refreshing={m.refreshing}
        generatedUtc={m.generatedUtc}
        onRefresh={() => {
          void m.load();
        }}
      />

      <PlanningBuyerChrome />

      {selectedReviewId.trim().length === 0 ? (
        <PlanningPickReviewBeforePlanningStrip
          selectedReviewId={selectedReviewId}
          onSelectReview={onSelectReview}
        />
      ) : null}

      {continueLastPlan !== null && !m.empty ? <PlanningContinueLastPlanRow plan={continueLastPlan} /> : null}

      {!buyerPolishedShell ? <PlanningReviewsVocabularyRail currentSurfaceId="improvement-planning" /> : null}
      {!buyerPolishedShell ? (
        <PlanningPlanDetailHubVocabularyRail currentSurfaceId="improvement-planning" />
      ) : null}

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
          <OperatorDemoStaticBanner emphasizeSampleData />
        </div>
      ) : null}

      {m.loading && m.summary === null ? (
        <OperatorLoadingNotice>
          <strong>Loading planning insights.</strong>
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Fetching themes, plans, and summary metrics…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.failure !== null ? (
        <div className="mb-4">
          <PlanningLoadFailurePanel
            failure={m.failure}
            retryLabel={IMPROVEMENT_PLANNING_LOAD_RETRY_LABEL}
            testId="planning-load-failure"
            retryTestId="planning-load-retry"
            retryDisabled={m.refreshing}
            onRetry={() => {
              void m.load();
            }}
          />
        </div>
      ) : null}

      {m.empty && !m.loading && !m.refreshing ? <PlanningPageEmptyState /> : null}

      {/* Empty path keeps CTA + orientation only — hide zero KPIs, empty shells, and export. */}
      {m.summary !== null && !m.empty ? (
        <>
          <PlanningSummarySection summary={m.summary} generatedUtc={m.generatedUtc} />

          {showTablesSkeleton ? (
            <PlanningTablesSkeleton
              themeRowCount={Math.max(m.sortedThemes.length, 3)}
              planRowCount={Math.max(m.sortedPlans.length, 3)}
            />
          ) : (
            <>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="planning-show-all-plans"
                      onClick={() => m.setSelectedThemeId(null)}
                    >
                      {IMPROVEMENT_PLANNING_SHOW_ALL_PLANS}
                    </Button>
                  </div>
                ) : null}

                {showThemeFilterNoMatch ? (
                  <EnterpriseCompactEmptyState
                    testId="planning-theme-filter-no-match-empty-state"
                    title={IMPROVEMENT_PLANNING_THEME_FILTER_NO_MATCH_TITLE}
                    description={IMPROVEMENT_PLANNING_THEME_FILTER_NO_MATCH_BODY}
                    footer={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="planning-clear-theme-filter"
                        onClick={() => {
                          m.setSelectedThemeId(null);
                        }}
                      >
                        {IMPROVEMENT_PLANNING_SHOW_ALL_PLANS}
                      </Button>
                    }
                  />
                ) : null}

                {!showThemeFilterNoMatch ? (
                  <div className={m.selectedThemeId === null ? "mt-3" : undefined}>
                    <PlanningPlansTable plans={m.visiblePlans} themeTitleById={m.themeTitleById} />
                  </div>
                ) : null}
              </section>
            </>
          )}

          {!showTablesSkeleton ? <PlanningExportReadinessNote /> : null}
          {m.usedPlanningDemoFallback && !showTablesSkeleton ? (
            <OperatorEvidenceLimitsFooter runId={SHOWCASE_STATIC_DEMO_RUN_ID} showArchitectureReviewSummaryLink={false} />
          ) : null}

          {selectedReviewId.trim().length > 0 ? (
            <PlanningNextReviewFooterClient runId={selectedReviewId.trim()} />
          ) : null}
        </>
      ) : null}
    </OperatorPageContainer>
  );
}

