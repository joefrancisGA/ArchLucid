import { cn } from "@/lib/utils";

import { InteractiveChip } from "@/components/ui/interactive-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  formatOperatorHomeGovernanceApprovalWarningFilterLabel,
} from "@/lib/operator/operator-home-governance-approval-warning-copy";
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

const FILTER_CHIP_LAYOUT_CLASS = "w-fit shrink-0 whitespace-nowrap";

const WARNINGS_FILTER_DISABLED_HINT =
  "No reviews with approval warnings in this workspace yet.";

export function RunsDashboardFilters(props: RunsDashboardFiltersProps) {
  if (props.buyerPolishedShell) {
    return null;
  }

  const warningsCount = props.governanceWarningsCount ?? 0;
  const warningsFilterDisabled = warningsCount === 0;

  return (
    <FilterChipGroup
      aria-label="Filter reviews"
      className="flex flex-wrap items-center gap-1.5"
      data-testid="runs-dashboard-filters"
    >
      {warningsFilterDisabled ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
          data-testid="runs-dashboard-governance-warnings-filter-hint"
        >
          {WARNINGS_FILTER_DISABLED_HINT}
        </p>
      ) : (
        <InteractiveChip
          data-testid="runs-dashboard-governance-warnings-only"
          className={cn(
            FILTER_CHIP_LAYOUT_CLASS,
            buyerFilterChipClass(
              props.governanceWarningsOnly,
              false,
              warningsCount === 0,
            ),
          )}
          aria-pressed={props.governanceWarningsOnly}
          onClick={() => {
            props.onGovernanceWarningsOnlyChange(!props.governanceWarningsOnly);
          }}
        >
          {formatOperatorHomeGovernanceApprovalWarningFilterLabel()}
        </InteractiveChip>
      )}
      <InteractiveChip
        data-testid="runs-dashboard-show-archived"
        className={cn(FILTER_CHIP_LAYOUT_CLASS, buyerFilterChipClass(props.showArchived, false, false))}
        aria-pressed={props.showArchived}
        onClick={() => {
          props.onShowArchivedChange(!props.showArchived);
        }}
      >
        {RUNS_DASHBOARD_LABELS.showArchived}
      </InteractiveChip>
    </FilterChipGroup>
  );
}
