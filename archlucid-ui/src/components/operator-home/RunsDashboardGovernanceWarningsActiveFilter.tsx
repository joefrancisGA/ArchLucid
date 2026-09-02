"use client";

import { cn } from "@/lib/utils";

import { DismissibleActiveFilterChip } from "@/components/ui/dismissible-active-filter-chip";
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
        Showing reviews matching
      </span>
      <DismissibleActiveFilterChip
        label={RUNS_DASHBOARD_LABELS.governanceWarningsOnly}
        onDismiss={props.onClear}
        testId="runs-dashboard-governance-warnings-active-filter-chip"
        dismissLabel={`Remove ${RUNS_DASHBOARD_LABELS.governanceWarningsOnly.toLowerCase()} filter`}
      />
    </div>
  );
}
