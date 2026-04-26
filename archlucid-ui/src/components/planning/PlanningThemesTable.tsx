import type { LearningPlanListItemResponse, LearningThemeResponse } from "@/types/learning";
import { planningNumericCellCls, planningTableCls, planningThTdCls } from "./planning-table-styles";

type PlanningThemesTableProps = {
  themes: LearningThemeResponse[];
  plans: LearningPlanListItemResponse[];
  selectedThemeId: string | null;
  onSelectThemeForPlans: (themeId: string) => void;
};

const browseBtnCls = "cursor-pointer px-2.5 py-1 text-[13px]";

function countPlansForTheme(plans: LearningPlanListItemResponse[], themeId: string): number {
  return plans.filter((p) => p.themeId === themeId).length;
}

/** Read-only theme list with evidence counts and a one-click path into filtered plans. */
export function PlanningThemesTable(props: PlanningThemesTableProps) {
  const { themes, plans, selectedThemeId, onSelectThemeForPlans } = props;

  if (themes.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400" role="status">
        No themes in this scope.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={planningTableCls}>
        <thead>
          <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
            <th className={planningThTdCls}>Title</th>
            <th className={planningThTdCls}>Severity</th>
            <th className={planningNumericCellCls}>Evidence signals</th>
            <th className={planningNumericCellCls}>Runs</th>
            <th className={planningThTdCls}>Area</th>
            <th className={planningThTdCls}>Plans</th>
            <th className={planningThTdCls}>Summary</th>
          </tr>
        </thead>
        <tbody>
          {themes.map((t) => {
            const planCount = countPlansForTheme(plans, t.themeId);
            const isActive = selectedThemeId === t.themeId;

            return (
              <tr key={t.themeId} className={isActive ? "bg-blue-50 dark:bg-blue-950/30" : ""}>
                <td className={planningThTdCls}>
                  <strong>{t.title}</strong>
                  <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{t.themeKey}</div>
                </td>
                <td className={planningThTdCls}>{t.severityBand}</td>
                <td className={planningNumericCellCls}>{t.evidenceSignalCount}</td>
                <td className={planningNumericCellCls}>{t.distinctRunCount}</td>
                <td className={planningThTdCls}>{t.affectedArtifactTypeOrWorkflowArea || "—"}</td>
                <td className={planningThTdCls}>
                  {planCount === 0 ? (
                    <span className="text-[13px] text-neutral-400 dark:text-neutral-500">—</span>
                  ) : (
                    <button
                      type="button"
                      className={browseBtnCls}
                      onClick={() => onSelectThemeForPlans(t.themeId)}
                      aria-pressed={isActive}
                      aria-label={`Show ${planCount} plan(s) for theme ${t.title}`}
                    >
                      {planCount} plan{planCount === 1 ? "" : "s"}
                    </button>
                  )}
                </td>
                <td className={`${planningThTdCls} max-w-[280px] text-[13px]`}>{t.summary}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
