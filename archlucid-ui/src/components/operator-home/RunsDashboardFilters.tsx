import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { BUYER_HOME_FILTER_ACTION_NEEDED } from "@/lib/buyer-home-status-copy";
import { buyerFilterChipActiveClass } from "@/lib/buyer-shell-home-present";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type RunsDashboardFiltersProps = {
  readonly buyerPolishedShell: boolean;
  readonly governanceWarningsOnly: boolean;
  readonly showArchived: boolean;
  readonly onGovernanceWarningsOnlyChange: (value: boolean) => void;
  readonly onShowArchivedChange: (value: boolean) => void;
};

export function RunsDashboardFilters(props: RunsDashboardFiltersProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
      data-testid="runs-dashboard-filters"
      role="group"
      aria-label="Filter review packages"
    >
      {props.buyerPolishedShell ? (
        <>
          <button
            type="button"
            data-testid="runs-dashboard-governance-warnings-only"
            aria-pressed={props.governanceWarningsOnly}
            onClick={() => {
              props.onGovernanceWarningsOnlyChange(!props.governanceWarningsOnly);
            }}
            className={cn(
              "inline-flex min-h-[22px] items-center gap-1.5 rounded-full border px-3 py-1 transition-colors",
              OPERATOR_TYPOGRAPHY.badge,
              buyerFilterChipActiveClass(props.governanceWarningsOnly),
            )}
          >
            <span aria-hidden="true">{props.governanceWarningsOnly ? "×" : "+"}</span>
            {BUYER_HOME_FILTER_ACTION_NEEDED}
          </button>
          <button
            type="button"
            data-testid="runs-dashboard-show-archived"
            aria-pressed={props.showArchived}
            onClick={() => {
              props.onShowArchivedChange(!props.showArchived);
            }}
            className={cn(
              "inline-flex min-h-[22px] items-center gap-1.5 rounded-full border px-3 py-1 transition-colors",
              OPERATOR_TYPOGRAPHY.badge,
              buyerFilterChipActiveClass(props.showArchived),
            )}
          >
            <span aria-hidden="true">{props.showArchived ? "×" : "+"}</span>
            Archived
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              id="runs-dashboard-governance-warnings-only"
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-neutral-400 dark:border-neutral-600"
              checked={props.governanceWarningsOnly}
              onChange={(e) => {
                props.onGovernanceWarningsOnlyChange(e.target.checked);
              }}
              data-testid="runs-dashboard-governance-warnings-only"
            />
            <Label htmlFor="runs-dashboard-governance-warnings-only" className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium")}>
              {RUNS_DASHBOARD_LABELS.governanceWarningsOnly}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="runs-dashboard-show-archived"
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-neutral-400 dark:border-neutral-600"
              checked={props.showArchived}
              onChange={(e) => {
                props.onShowArchivedChange(e.target.checked);
              }}
              data-testid="runs-dashboard-show-archived"
            />
            <Label htmlFor="runs-dashboard-show-archived" className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium")}>
              {RUNS_DASHBOARD_LABELS.showArchived}
            </Label>
          </div>
        </>
      )}
    </div>
  );
}
