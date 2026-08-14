"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorBrandedRouteLoadFailure } from "@/components/operator/OperatorBrandedRouteLoadFailure";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PlanningPlanDetailHubVocabularyRail } from "@/components/PlanningPlanDetailHubVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { resolveApiLoadFailurePresentation } from "@/lib/api-load-failure";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PLANNING_PLAN_DETAIL_PAGE_TITLE } from "@/lib/planning-plan-detail-evidence-copy";

import { PlanningPlanDetailSections } from "./PlanningPlanDetailSections";
import type { UsePlanningPlanDetailPageModel } from "./use-planning-plan-detail-page";

type PlanningPlanDetailPageViewProps = {
  model: UsePlanningPlanDetailPageModel;
};

export function PlanningPlanDetailPageView({ model }: PlanningPlanDetailPageViewProps) {
  const { failure, loading, plan, planId } = model;

  return (
    <div className="max-w-3xl">
      {failure !== null && resolveApiLoadFailurePresentation(failure) !== "error" ? (
        <OperatorBrandedRouteLoadFailure failure={failure} retryLabel="Retry loading plan" />
      ) : (
        <>
          <OperatorPageHeader
            title={PLANNING_PLAN_DETAIL_PAGE_TITLE}
            titleTestId="planning-plan-detail-title"
            subtitle="Derived improvement plan from captured review feedback."
            actions={<PageContextualHelpButton />}
            metadata={
              <Link className={OPERATOR_LINK.optional} href={PLANNING_PATH}>
                Back to Improvement planning
              </Link>
            }
          />

          <PlanningPlanDetailHubVocabularyRail currentSurfaceId="plan-detail" />

          {!planId.trim() ? (
            <p role="alert" className="text-red-700 dark:text-red-400">
              Missing plan id.
            </p>
          ) : null}

          {loading && plan === null && planId.trim().length > 0 ? (
            <OperatorLoadingNotice>
              <strong>Loading plan.</strong>
              <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Fetching plan detail from the API…</p>
            </OperatorLoadingNotice>
          ) : null}

          {failure !== null && resolveApiLoadFailurePresentation(failure) === "error" ? (
            <div role="alert" className="mb-4">
              <OperatorApiProblem
                problem={failure.problem}
                fallbackMessage={failure.message}
                correlationId={failure.correlationId}
              />
            </div>
          ) : null}

          {plan !== null ? <PlanningPlanDetailSections plan={plan} /> : null}
        </>
      )}
    </div>
  );
}
