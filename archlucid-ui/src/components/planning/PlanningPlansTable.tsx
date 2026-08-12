import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import { IMPROVEMENT_PLANNING_PLANS_EMPTY_MESSAGE } from "@/lib/planning-page-copy";
import { planningPlanDetailPath } from "@/lib/planning-route";
import type { LearningPlanListItemResponse } from "@/types/learning";
import { planningNumericCellCls, planningTableCls, planningThTdCls } from "./planning-table-styles";

type PlanningPlansTableProps = {
  plans: LearningPlanListItemResponse[];
  themeTitleById: Map<string, string>;
};

const mutedNoteCls = cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper);

function resolveRecommendedNextAction(plan: LearningPlanListItemResponse): string {
  const explanation = plan.priorityExplanation?.trim();

  if (explanation !== undefined && explanation.length > 0) {
    return explanation;
  }

  return plan.summary.trim().length > 0 ? plan.summary : "Open the plan for recommended action steps.";
}

/** Prioritized plans with theme context and links into read-only detail. */
export function PlanningPlansTable(props: PlanningPlansTableProps) {
  const { plans, themeTitleById } = props;

  if (plans.length === 0) {
    return (
      <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
        {IMPROVEMENT_PLANNING_PLANS_EMPTY_MESSAGE}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={planningTableCls}>
        <thead>
          <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
            <th className={planningNumericCellCls}>Priority</th>
            <th className={planningThTdCls}>Plan</th>
            <th className={planningThTdCls}>Theme</th>
            <th className={planningThTdCls}>Status</th>
            <th className={planningThTdCls}>Recommended next action</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.planId}>
              <td className={planningNumericCellCls}>{p.priorityScore}</td>
              <td className={planningThTdCls}>
                <Link href={planningPlanDetailPath(p.planId)} className={OPERATOR_LINK.nav}>
                  {p.title}
                </Link>
              </td>
              <td className={planningThTdCls}>
                <span className={mutedNoteCls}>{themeTitleById.get(p.themeId) ?? p.themeId}</span>
              </td>
              <td className={planningThTdCls}>{p.status}</td>
              <td className={cn(planningThTdCls, "max-w-[320px]", OPERATOR_TYPOGRAPHY.helper)}>
                {resolveRecommendedNextAction(p)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
