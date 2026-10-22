import type { ReactElement } from "react";

import { EnterpriseTableHeaderCell } from "@/components/ui/enterprise-table";
import type { ResourcesExplorerTableSortKey } from "@/lib/infra-evidence/resources-explorer-table-sort";
import { cn } from "@/lib/utils";

export function ResourcesExplorerSortHeaderCell(props: {
  readonly label: string;
  readonly sortKey: ResourcesExplorerTableSortKey;
  readonly activeSortKey: ResourcesExplorerTableSortKey;
  readonly sortAsc: boolean;
  readonly sortDirection: "ascending" | "descending" | "none";
  readonly onSort: (sortKey: ResourcesExplorerTableSortKey) => void;
}): ReactElement {
  const isActive = props.activeSortKey === props.sortKey;
  const directionLabel = props.sortAsc ? "ascending" : "descending";

  return (
    <EnterpriseTableHeaderCell sortDirection={props.sortDirection}>
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
