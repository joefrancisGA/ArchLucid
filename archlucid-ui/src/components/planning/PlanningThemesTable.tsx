import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { IMPROVEMENT_PLANNING_THEMES_EMPTY_MESSAGE } from "@/lib/planning-page-copy";
import type { LearningPlanListItemResponse, LearningThemeResponse } from "@/types/learning";
import { planningNumericCellCls, planningTableCls, planningThTdCls } from "./planning-table-styles";

type PlanningThemesTableProps = {
  themes: LearningThemeResponse[];
  plans: LearningPlanListItemResponse[];
  selectedThemeId: string | null;
  onSelectThemeForPlans: (themeId: string) => void;
};

const browseBtnCls = cn(
  "cursor-pointer rounded-md border border-neutral-300 px-2.5 py-1 font-medium text-blue-900 hover:bg-neutral-100 dark:border-neutral-600 dark:text-blue-300 dark:hover:bg-neutral-800",
  OPERATOR_TYPOGRAPHY.helper,
);

function countPlansForTheme(plans: LearningPlanListItemResponse[], themeId: string): number {
  return plans.filter((p) => p.themeId === themeId).length;
}

/** Theme list with feedback signal counts and a one-click path into filtered plans. */
export function PlanningThemesTable(props: PlanningThemesTableProps) {
  const { themes, plans, selectedThemeId, onSelectThemeForPlans } = props;

  if (themes.length === 0) {
    return (
      <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
        {IMPROVEMENT_PLANNING_THEMES_EMPTY_MESSAGE}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={planningTableCls}>
        <thead>
          <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
            <th className={planningThTdCls}>Theme</th>
            <th className={planningNumericCellCls}>Feedback signals</th>
            <th className={planningThTdCls}>Impacted area</th>
            <th className={planningThTdCls}>Action</th>
          </tr>
        </thead>
        <tbody>
          {themes.map((t) => {
            const planCount = countPlansForTheme(plans, t.themeId);
            const isActive = selectedThemeId === t.themeId;

            return (
              <tr key={t.themeId} className={isActive ? "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80" : ""}>
                <td className={planningThTdCls}>
                  <strong>{t.title}</strong>
                  <div className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{t.summary}</div>
                </td>
                <td className={planningNumericCellCls}>{t.evidenceSignalCount}</td>
                <td className={planningThTdCls}>{t.affectedArtifactTypeOrWorkflowArea || "—"}</td>
                <td className={planningThTdCls}>
                  {planCount === 0 ? (
                    <span className={cn("text-neutral-400 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                      Plans pending
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={browseBtnCls}
                      onClick={() => onSelectThemeForPlans(t.themeId)}
                      aria-pressed={isActive}
                      aria-label={`View ${planCount} plan(s) for theme ${t.title}`}
                    >
                      View {planCount} plan{planCount === 1 ? "" : "s"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
