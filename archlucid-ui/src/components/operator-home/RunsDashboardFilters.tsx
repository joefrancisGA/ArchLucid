import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatOperatorHomeApprovalCheckWarningFilterLabel } from "@/lib/operator/operator-home-approval-check-warning-copy";
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
  if (props.buyerPolishedShell) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
      data-testid="runs-dashboard-filters"
      role="group"
      aria-label="Filter reviews"
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id="runs-dashboard-governance-warnings-only"
          checked={props.governanceWarningsOnly}
          onCheckedChange={(checked) => {
            props.onGovernanceWarningsOnlyChange(checked === true);
          }}
          data-testid="runs-dashboard-governance-warnings-only"
        />
        <Label htmlFor="runs-dashboard-governance-warnings-only" className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium")}>
          {formatOperatorHomeApprovalCheckWarningFilterLabel()}
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="runs-dashboard-show-archived"
          checked={props.showArchived}
          onCheckedChange={(checked) => {
            props.onShowArchivedChange(checked === true);
          }}
          data-testid="runs-dashboard-show-archived"
        />
        <Label htmlFor="runs-dashboard-show-archived" className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium")}>
          {RUNS_DASHBOARD_LABELS.showArchived}
        </Label>
      </div>
    </div>
  );
}
