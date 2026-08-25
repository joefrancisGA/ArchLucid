import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { planningPlanDetailPath } from "@/lib/planning-route";
import type { LearningPlanListItemResponse } from "@/types/learning";
import { cn } from "@/lib/utils";

export type PlanningPlanDetailNextPlanFooterProps = {
  readonly plan: LearningPlanListItemResponse;
};

/** Footer CTA to continue with the next plan in this theme. */
export function PlanningPlanDetailNextPlanFooter(
  props: PlanningPlanDetailNextPlanFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="planning-plan-detail-next-plan-footer"
      aria-label="Next plan in this theme"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next plan in this theme</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.plan.title}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="planning-plan-detail-next-plan-action">
        <Link href={planningPlanDetailPath(props.plan.planId)}>Open next plan</Link>
      </Button>
    </section>
  );
}
