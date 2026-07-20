import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { RecommendationCategoryTrendRow, RecommendationCategoryVolumeRow } from "./recommendation-learning-display";

type OutcomeBarChartProps = {
  readonly rows: readonly RecommendationCategoryTrendRow[];
};

const OUTCOME_COLORS = {
  accepted: "bg-emerald-600 dark:bg-emerald-500",
  implemented: "bg-teal-700 dark:bg-teal-500",
  deferred: "bg-amber-500 dark:bg-amber-400",
  rejected: "bg-rose-600 dark:bg-rose-500",
} as const;

export function RecommendationLearningOutcomeBarChart(props: OutcomeBarChartProps): ReactNode {
  const { rows } = props;

  if (rows.length === 0) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Outcome trends appear after recommendations are classified.
      </p>
    );
  }

  return (
    <div className="space-y-3" role="img" aria-label="Recommendation acceptance trends by category">
      {rows.map((row) => {
        const segments = [
          { key: "accepted", count: row.accepted, className: OUTCOME_COLORS.accepted, label: "Accepted" },
          { key: "implemented", count: row.implemented, className: OUTCOME_COLORS.implemented, label: "Implemented" },
          { key: "deferred", count: row.deferred, className: OUTCOME_COLORS.deferred, label: "Deferred" },
          { key: "rejected", count: row.rejected, className: OUTCOME_COLORS.rejected, label: "Rejected" },
        ].filter((segment) => segment.count > 0);

        return (
          <div key={row.category}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.category}</span>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {row.total.toLocaleString()} outcomes
              </span>
            </div>
            <div
              className="flex h-3 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
              title={segments.map((segment) => `${segment.label}: ${segment.count}`).join(" · ")}
            >
              {segments.map((segment) => (
                <div
                  key={`${row.category}-${segment.key}`}
                  className={cn(segment.className, "h-full")}
                  style={{ width: `${(segment.count / row.total) * 100}%` }}
                />
              ))}
            </div>
          </div>
        );
      })}
      <ul className={cn("m-0 flex flex-wrap gap-3 list-none p-0", OPERATOR_TYPOGRAPHY.helper)}>
        {Object.entries(OUTCOME_COLORS).map(([key, className]) => (
          <li key={key} className="flex items-center gap-1.5 text-al-text-secondary">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-sm", className)} aria-hidden />
            <span className="capitalize">{key}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CategoryVolumeChartProps = {
  readonly rows: readonly RecommendationCategoryVolumeRow[];
};

export function RecommendationLearningCategoryVolumeChart(props: CategoryVolumeChartProps): ReactNode {
  const { rows } = props;

  if (rows.length === 0) {
    return null;
  }

  const maxCount = Math.max(...rows.map((row) => row.count), 1);
  const barMaxPx = 120;

  return (
    <div
      className="flex items-end gap-2 border-b border-neutral-200 pb-1 dark:border-neutral-700"
      role="img"
      aria-label="Recommendations by category"
    >
      {rows.map((row) => {
        const barPx = Math.max(8, (row.count / maxCount) * barMaxPx);

        return (
          <div key={row.category} className="flex min-h-[144px] min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <div
              className="w-full max-w-[2.5rem] rounded-t bg-teal-700/90 dark:bg-teal-500/90"
              style={{ height: barPx }}
              title={`${row.category}: ${row.count.toLocaleString()} recommendations`}
            />
            <span className={cn("truncate text-center text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>
              {row.category}
            </span>
          </div>
        );
      })}
    </div>
  );
}
