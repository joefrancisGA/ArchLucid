"use client";

import Link from "next/link";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { isApiNotFoundFailure } from "@/lib/api-load-failure";

import { PlanningPlanDetailSections } from "./PlanningPlanDetailSections";
import type { UsePlanningPlanDetailPageModel } from "./use-planning-plan-detail-page";

type PlanningPlanDetailPageViewProps = {
  model: UsePlanningPlanDetailPageModel;
};

export function PlanningPlanDetailPageView({ model }: PlanningPlanDetailPageViewProps) {
  const { failure, loading, plan, planId } = model;

  return (
    <div className="max-w-3xl">
      {failure !== null && isApiNotFoundFailure(failure) ? (
        <OperatorBrandedNotFound />
      ) : (
        <>
          <p className="mt-0 mb-4">
            <Link href="/planning" className="text-blue-700 dark:text-blue-400 text-sm">
              ← Back to planning
            </Link>
          </p>

          <h2 className="mt-0">Improvement plan</h2>

          {!planId.trim() ? (
            <p role="alert" className="text-red-700 dark:text-red-400">
              Missing plan id.
            </p>
          ) : null}

          {loading && plan === null && planId.trim().length > 0 ? (
            <OperatorLoadingNotice>
              <strong>Loading plan.</strong>
              <p className="mt-2 text-sm">Fetching plan detail from the API…</p>
            </OperatorLoadingNotice>
          ) : null}

          {failure !== null && !isApiNotFoundFailure(failure) ? (
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
