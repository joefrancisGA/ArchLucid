"use client";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
} from "@/components/ui/enterprise-table";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_CAPTURED_COLUMN_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_RELATIONSHIPS_COLUMN_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_RESOURCES_COLUMN_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_DELETE_ACTION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECT_ACTION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SUBSCRIPTION_COLUMN_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import type {
  DriftSnapshotsTableFilterState,
  DriftSnapshotsTableSortKey,
} from "@/lib/infra-evidence/infra-evidence-drift-snapshots-table-filter";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  DriftChangesTableHeaderCell,
  type DriftChangesTableHeaderFilterConfig,
} from "./DriftChangesTableHeaderCell";

function sortDirectionForColumn(
  sortBy: DriftSnapshotsTableSortKey,
  column: DriftSnapshotsTableSortKey,
  sortDir: "asc" | "desc",
): "ascending" | "descending" | "none" {
  if (sortBy !== column) {
    return "none";
  }

  return sortDir === "asc" ? "ascending" : "descending";
}

export type DriftSnapshotsTableHeadProps = {
  readonly tableFilterState: DriftSnapshotsTableFilterState;
  readonly hasActiveFilters: boolean;
  readonly onSortColumn: (column: DriftSnapshotsTableSortKey) => void;
  readonly onTableFiltersChange: (patch: Partial<DriftSnapshotsTableFilterState>) => void;
  readonly onClearFilters: () => void;
};

export function DriftSnapshotsTableHead(props: DriftSnapshotsTableHeadProps): React.JSX.Element {
  const { tableFilterState, hasActiveFilters, onSortColumn, onTableFiltersChange, onClearFilters } = props;

  const renderHeader = (
    column: DriftSnapshotsTableSortKey,
    label: string,
    filter?: DriftChangesTableHeaderFilterConfig,
  ): React.JSX.Element => (
    <DriftChangesTableHeaderCell
      key={column}
      column={column}
      label={label}
      sortBy={tableFilterState.sortBy}
      sortDir={tableFilterState.sortDir}
      sortDirection={sortDirectionForColumn(tableFilterState.sortBy, column, tableFilterState.sortDir)}
      onSort={() => {
        onSortColumn(column);
      }}
      filter={filter}
    />
  );

  return (
    <EnterpriseTableHead>
      <EnterpriseTableHeadRow>
        {renderHeader("subscription", GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SUBSCRIPTION_COLUMN_LABEL, {
          kind: "text",
          value: tableFilterState.subscriptionFilter,
          placeholder: "Production",
          filterTestId: "infra-drift-snapshot-subscription-filter",
          onApply: (value) => {
            onTableFiltersChange({ subscriptionFilter: value });
          },
          onClear: () => {
            onTableFiltersChange({ subscriptionFilter: "" });
          },
        })}
        {renderHeader("captured", GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_CAPTURED_COLUMN_LABEL, {
          kind: "text",
          value: tableFilterState.capturedFilter,
          placeholder: "9/10/2026",
          filterTestId: "infra-drift-snapshot-captured-filter",
          onApply: (value) => {
            onTableFiltersChange({ capturedFilter: value });
          },
          onClear: () => {
            onTableFiltersChange({ capturedFilter: "" });
          },
        })}
        {renderHeader("resources", GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_RESOURCES_COLUMN_LABEL, {
          kind: "text",
          value: tableFilterState.resourcesFilter,
          placeholder: "889",
          filterTestId: "infra-drift-snapshot-resources-filter",
          onApply: (value) => {
            onTableFiltersChange({ resourcesFilter: value });
          },
          onClear: () => {
            onTableFiltersChange({ resourcesFilter: "" });
          },
        })}
        {renderHeader("relationships", GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_RELATIONSHIPS_COLUMN_LABEL, {
          kind: "text",
          value: tableFilterState.relationshipsFilter,
          placeholder: "972",
          filterTestId: "infra-drift-snapshot-relationships-filter",
          onApply: (value) => {
            onTableFiltersChange({ relationshipsFilter: value });
          },
          onClear: () => {
            onTableFiltersChange({ relationshipsFilter: "" });
          },
        })}
        <EnterpriseTableHeaderCell>
          {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECT_ACTION_LABEL}
          {" / "}
          {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_DELETE_ACTION_LABEL}
        </EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
      {hasActiveFilters ? (
        <tr data-testid="infra-drift-snapshot-active-filters-row">
          <th colSpan={5} className="border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-left dark:border-neutral-800 dark:bg-neutral-900/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Column filters active
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-testid="infra-drift-snapshot-clear-filters"
                onClick={onClearFilters}
              >
                Clear all filters
              </Button>
            </div>
          </th>
        </tr>
      ) : null}
    </EnterpriseTableHead>
  );
}
