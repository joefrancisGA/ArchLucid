"use client";

import { Button } from "@/components/ui/button";
import { EnterpriseTableHead, EnterpriseTableHeadRow } from "@/components/ui/enterprise-table";
import {
  INFRA_EVIDENCE_DRIFT_CHANGE_TYPE_FILTER_OPTIONS,
  INFRA_EVIDENCE_DRIFT_RISK_FILTER_OPTIONS,
} from "@/lib/infra-evidence/infra-evidence-drift-display";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_COLUMN_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_GROUP_COLUMN_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_TYPE_COLUMN_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import type { DriftTableFilterState, DriftTableSortKey } from "@/lib/infra-evidence/infra-evidence-drift-table-filter";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  DriftChangesTableHeaderCell,
  type DriftChangesTableHeaderFilterConfig,
} from "./DriftChangesTableHeaderCell";

function sortDirectionForColumn(
  sortBy: DriftTableSortKey,
  column: DriftTableSortKey,
  sortDir: "asc" | "desc",
): "ascending" | "descending" | "none" {
  if (sortBy !== column) {
    return "none";
  }

  return sortDir === "asc" ? "ascending" : "descending";
}

export const DRIFT_INVENTORY_TABLE_COLUMN_COUNT = 3;
export const DRIFT_CHANGES_TABLE_COLUMN_COUNT = 6;

export type DriftChangesTableHeadProps = {
  readonly tableFilterState: DriftTableFilterState;
  readonly hasActiveFilters: boolean;
  readonly showDiffColumns: boolean;
  readonly onSortColumn: (column: DriftTableSortKey) => void;
  readonly onTableFiltersChange: (patch: Partial<DriftTableFilterState>) => void;
  readonly onClearFilters: () => void;
};

export function DriftChangesTableHead(props: DriftChangesTableHeadProps): React.JSX.Element {
  const {
    tableFilterState,
    hasActiveFilters,
    showDiffColumns,
    onSortColumn,
    onTableFiltersChange,
    onClearFilters,
  } = props;
  const columnCount = showDiffColumns ? DRIFT_CHANGES_TABLE_COLUMN_COUNT : DRIFT_INVENTORY_TABLE_COLUMN_COUNT;

  const renderHeader = (
    column: DriftTableSortKey,
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

  const resetPagePatch = { changesPage: 1 } as const;

  return (
    <EnterpriseTableHead>
      <EnterpriseTableHeadRow>
        {renderHeader("resource", GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_COLUMN_LABEL, {
          kind: "text",
          value: tableFilterState.resourceFilter,
          placeholder: "gateway",
          filterTestId: "infra-drift-resource-filter",
          onApply: (value) => {
            onTableFiltersChange({ resourceFilter: value, ...resetPagePatch });
          },
          onClear: () => {
            onTableFiltersChange({ resourceFilter: "", ...resetPagePatch });
          },
        })}
        {renderHeader("resourceGroup", GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_GROUP_COLUMN_LABEL, {
          kind: "text",
          value: tableFilterState.resourceGroupFilter,
          placeholder: "rg-network",
          filterTestId: "infra-drift-resource-group-filter",
          onApply: (value) => {
            onTableFiltersChange({ resourceGroupFilter: value, ...resetPagePatch });
          },
          onClear: () => {
            onTableFiltersChange({ resourceGroupFilter: "", ...resetPagePatch });
          },
        })}
        {renderHeader("resourceType", GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_TYPE_COLUMN_LABEL, {
          kind: "text",
          value: tableFilterState.resourceTypeFilter,
          placeholder: "Network/publicIPAddresses",
          filterTestId: "infra-drift-resource-type-filter",
          onApply: (value) => {
            onTableFiltersChange({ resourceTypeFilter: value, ...resetPagePatch });
          },
          onClear: () => {
            onTableFiltersChange({ resourceTypeFilter: "", ...resetPagePatch });
          },
        })}
        {showDiffColumns ? (
          <>
            {renderHeader("change", "Change", {
              kind: "select",
              value: tableFilterState.changeTypeFilter,
              options: INFRA_EVIDENCE_DRIFT_CHANGE_TYPE_FILTER_OPTIONS,
              filterTestId: "infra-drift-change-type-filter",
              onChange: (value) => {
                onTableFiltersChange({ changeTypeFilter: value, ...resetPagePatch });
              },
              onClear: () => {
                onTableFiltersChange({ changeTypeFilter: "", ...resetPagePatch });
              },
            })}
            {renderHeader("property", "Property", {
              kind: "text",
              value: tableFilterState.propertyFilter,
              placeholder: "sku",
              filterTestId: "infra-drift-property-filter",
              onApply: (value) => {
                onTableFiltersChange({ propertyFilter: value, ...resetPagePatch });
              },
              onClear: () => {
                onTableFiltersChange({ propertyFilter: "", ...resetPagePatch });
              },
            })}
            {renderHeader("risk", "Risk", {
              kind: "select",
              value: tableFilterState.riskFilter,
              options: INFRA_EVIDENCE_DRIFT_RISK_FILTER_OPTIONS,
              filterTestId: "infra-drift-risk-filter",
              onChange: (value) => {
                onTableFiltersChange({ riskFilter: value, ...resetPagePatch });
              },
              onClear: () => {
                onTableFiltersChange({ riskFilter: "", ...resetPagePatch });
              },
            })}
          </>
        ) : null}
      </EnterpriseTableHeadRow>
      {hasActiveFilters ? (
        <tr data-testid="infra-drift-active-filters-row">
          <th colSpan={columnCount} className="border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-left dark:border-neutral-800 dark:bg-neutral-900/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Column filters active
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-testid="infra-drift-clear-filters"
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
