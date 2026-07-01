"use client";

import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorBrandedRouteLoadFailure } from "@/components/OperatorBrandedRouteLoadFailure";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { resolveApiLoadFailurePresentation } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
          <h2 className={cn("mt-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Improvement plan</h2>

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
