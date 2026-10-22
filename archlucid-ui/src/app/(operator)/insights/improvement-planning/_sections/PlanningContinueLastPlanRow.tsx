"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import { planningPlanDetailHref } from "@/lib/planning-route";
import type { LearningPlanListItemResponse } from "@/types/learning";
import { cn } from "@/lib/utils";

export type PlanningContinueLastPlanRowProps = {
  readonly plan: LearningPlanListItemResponse;
  readonly scopedRunId?: string;
};

/** Pinned continue row for the most recently created improvement plan. */
export function PlanningContinueLastPlanRow(props: PlanningContinueLastPlanRowProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="planning-continue-last-plan-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="planning-continue-last-plan-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="planning-continue-last-plan-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last plan
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.plan.title}</span>
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" asChild data-testid="planning-continue-last-plan-open">
          <Link href={planningPlanDetailHref(props.plan.planId, props.scopedRunId)}>Open plan</Link>
        </Button>
      </div>
    </section>
  );
}
