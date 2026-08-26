import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import { IMPROVEMENT_PLANNING_PLANS_EMPTY_MESSAGE, IMPROVEMENT_PLANNING_THEME_ID_LABEL } from "@/lib/planning-page-copy";
import { planningPlanDetailHref } from "@/lib/planning-route";
import type { LearningPlanListItemResponse } from "@/types/learning";
import { planningNumericCellCls, planningThTdCls } from "./planning-table-styles";

type PlanningPlansTableProps = {
  plans: LearningPlanListItemResponse[];
  themeTitleById: Map<string, string>;
  scopedRunId?: string;
};

const mutedNoteCls = cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper);

function resolveRecommendedNextAction(plan: LearningPlanListItemResponse): string {
  const explanation = plan.priorityExplanation?.trim();

  if (explanation !== undefined && explanation.length > 0) {
    return explanation;
  }

  return plan.summary.trim().length > 0 ? plan.summary : "Open the plan for recommended action steps.";
}

function resolveThemeLabel(themeId: string, themeTitleById: Map<string, string>): ReactNode {
  const title = themeTitleById.get(themeId)?.trim();

  if (title !== undefined && title.length > 0) {
    return <span className={mutedNoteCls}>{title}</span>;
  }

  return <TechnicalIdDisclosure label={IMPROVEMENT_PLANNING_THEME_ID_LABEL} value={themeId} />;
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
    <EnterpriseTable ariaLabel="Improvement plans" className={OPERATOR_TYPOGRAPHY.body}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell className={planningNumericCellCls}>Priority</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={planningThTdCls}>Plan</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={planningThTdCls}>Theme</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={planningThTdCls}>Status</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={planningThTdCls}>Recommended next action</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {plans.map((p) => (
          <EnterpriseTableRow key={p.planId}>
            <EnterpriseTableCell className={planningNumericCellCls}>{p.priorityScore}</EnterpriseTableCell>
            <EnterpriseTableCell className={planningThTdCls}>
              <Link href={planningPlanDetailHref(p.planId, props.scopedRunId)} className={OPERATOR_LINK.nav}>
                {p.title}
              </Link>
            </EnterpriseTableCell>
            <EnterpriseTableCell className={planningThTdCls}>{resolveThemeLabel(p.themeId, themeTitleById)}</EnterpriseTableCell>
            <EnterpriseTableCell className={planningThTdCls}>{p.status}</EnterpriseTableCell>
            <EnterpriseTableCell className={cn(planningThTdCls, "max-w-[320px]", OPERATOR_TYPOGRAPHY.helper)}>
              {resolveRecommendedNextAction(p)}
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
