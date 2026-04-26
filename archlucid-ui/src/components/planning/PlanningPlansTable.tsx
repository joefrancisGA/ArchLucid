import Link from "next/link";
import type { LearningPlanListItemResponse } from "@/types/learning";
import { planningNumericCellCls, planningTableCls, planningThTdCls } from "./planning-table-styles";

type PlanningPlansTableProps = {
  plans: LearningPlanListItemResponse[];
  themeTitleById: Map<string, string>;
};

const mutedNoteCls = "text-[13px] text-neutral-500 dark:text-neutral-400";

/** Prioritized plans with theme context and links into read-only detail. */
export function PlanningPlansTable(props: PlanningPlansTableProps) {
  const { plans, themeTitleById } = props;

  if (plans.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400" role="status">
        No plans in this scope.
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
            <th className={planningNumericCellCls}>Theme evidence</th>
            <th className={planningThTdCls}>Status</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.planId}>
              <td className={planningNumericCellCls}>{p.priorityScore}</td>
              <td className={planningThTdCls}>
                <Link href={`/planning/plans/${encodeURIComponent(p.planId)}`} className="text-blue-700 dark:text-blue-400">
                  {p.title}
                </Link>
                <div className="mt-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">{p.summary}</div>
              </td>
              <td className={planningThTdCls}>
                <span className={mutedNoteCls}>{themeTitleById.get(p.themeId) ?? p.themeId}</span>
              </td>
              <td className={planningNumericCellCls}>{p.themeEvidenceSignalCount ?? "—"}</td>
              <td className={planningThTdCls}>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
