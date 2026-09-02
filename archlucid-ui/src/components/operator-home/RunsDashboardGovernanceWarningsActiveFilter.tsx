"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type RunsDashboardGovernanceWarningsActiveFilterProps = {
  readonly visible: boolean;
  readonly onClear: () => void;
};

/** Visible active-filter affordance when home Recent reviews is scoped to governance warnings. */
export function RunsDashboardGovernanceWarningsActiveFilter(
  props: RunsDashboardGovernanceWarningsActiveFilterProps,
): React.JSX.Element | null {
  if (!props.visible) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="runs-dashboard-governance-warnings-active-filter"
      role="status"
    >
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Showing reviews with {RUNS_DASHBOARD_LABELS.governanceWarningsOnly.toLowerCase()}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-auto px-2 py-1 text-al-text-primary"
        onClick={props.onClear}
        data-testid="runs-dashboard-governance-warnings-clear"
      >
        Clear
      </Button>
    </div>
  );
}
