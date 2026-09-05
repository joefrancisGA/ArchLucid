import { cn } from "@/lib/utils";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { formatOperatorHomeGovernanceApprovalWarningFilterLabel } from "@/lib/operator/operator-home-governance-approval-warning-copy";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type RunsDashboardFiltersProps = {
  readonly buyerPolishedShell: boolean;
  readonly governanceWarningsOnly: boolean;
  readonly governanceWarningsCount?: number;
  readonly showArchived: boolean;
  readonly onGovernanceWarningsOnlyChange: (value: boolean) => void;
  readonly onShowArchivedChange: (value: boolean) => void;
};

const WARNINGS_FILTER_DISABLED_HINT_ID = "runs-dashboard-governance-warnings-filter-hint";

export function RunsDashboardFilters(props: RunsDashboardFiltersProps) {
  if (props.buyerPolishedShell) {
    return null;
  }

  const warningsCount = props.governanceWarningsCount ?? 0;
  const warningsFilterDisabled = warningsCount === 0;

  return (
    <div className="space-y-1.5" data-testid="runs-dashboard-filters">
      <FilterChipGroup
        aria-label="Filter reviews"
        className="flex flex-wrap items-center gap-1.5"
      >
        <div className="inline-flex flex-col gap-1">
          <FilterChip
            data-testid="runs-dashboard-governance-warnings-only"
            className={buyerFilterChipClass(
              props.governanceWarningsOnly,
              warningsFilterDisabled,
              warningsCount === 0,
            )}
            aria-pressed={props.governanceWarningsOnly}
            aria-describedby={warningsFilterDisabled ? WARNINGS_FILTER_DISABLED_HINT_ID : undefined}
            disabled={warningsFilterDisabled}
            onClick={() => {
              if (warningsFilterDisabled) {
                return;
              }

              props.onGovernanceWarningsOnlyChange(!props.governanceWarningsOnly);
            }}
          >
            {formatOperatorHomeGovernanceApprovalWarningFilterLabel()}
          </FilterChip>
          {warningsFilterDisabled ? (
            <p
              id={WARNINGS_FILTER_DISABLED_HINT_ID}
              className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
            >
              No reviews with governance approval warnings in this workspace yet.
            </p>
          ) : null}
        </div>
        <FilterChip
          data-testid="runs-dashboard-show-archived"
          className={buyerFilterChipClass(props.showArchived, false, false)}
          aria-pressed={props.showArchived}
          onClick={() => {
            props.onShowArchivedChange(!props.showArchived);
          }}
        >
          {RUNS_DASHBOARD_LABELS.showArchived}
        </FilterChip>
      </FilterChipGroup>
    </div>
  );
}
