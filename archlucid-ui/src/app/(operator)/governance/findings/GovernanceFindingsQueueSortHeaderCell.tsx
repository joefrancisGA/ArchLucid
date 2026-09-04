import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { EnterpriseTableHeaderCell } from "@/components/ui/enterprise-table";
import type { GovernanceAssignedToMeQueueSortKey } from "@/lib/governance/governance-assigned-to-me-queue-sort";

export function GovernanceFindingsQueueSortHeaderCell(props: {
  readonly label: string;
  readonly sortKey: GovernanceAssignedToMeQueueSortKey;
  readonly activeSortKey: GovernanceAssignedToMeQueueSortKey;
  readonly sortAsc: boolean;
  readonly onSort: (sortKey: GovernanceAssignedToMeQueueSortKey) => void;
  readonly className?: string;
}): ReactElement {
  const isActive = props.activeSortKey === props.sortKey;
  const directionLabel = props.sortAsc ? "ascending" : "descending";

  return (
    <EnterpriseTableHeaderCell className={props.className}>
      <button
        type="button"
        className={cn(
          "font-inherit text-left font-semibold text-al-text-secondary hover:text-al-text-primary",
          isActive ? "text-al-text-primary" : undefined,
        )}
        aria-label={
          isActive ? `Sort by ${props.label}, ${directionLabel}` : `Sort by ${props.label}`
        }
        onClick={() => {
          props.onSort(props.sortKey);
        }}
      >
        {props.label}
        {isActive ? (props.sortAsc ? " ↑" : " ↓") : null}
      </button>
    </EnterpriseTableHeaderCell>
  );
}
