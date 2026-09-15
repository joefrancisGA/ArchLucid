"use client";

import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_ARIA_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_LOADING_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECT_ACTION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECTED_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  formatInfraEvidenceSnapshotCapturedLabel,
  formatInfraEvidenceSubscriptionLabel,
} from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import type { DriftSnapshotsTableFilterState } from "@/lib/infra-evidence/infra-evidence-drift-snapshots-table-filter";
import { cn } from "@/lib/utils";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";

import { DriftSnapshotsTableHead } from "./DriftSnapshotsTableHead";

export type DriftSnapshotsTableProps = {
  readonly snapshots: readonly InfraEvidenceSnapshotSummary[];
  readonly selectedSnapshotId: string;
  readonly loading: boolean;
  readonly tableFilterState: DriftSnapshotsTableFilterState;
  readonly hasActiveFilters: boolean;
  readonly onSelectSnapshot: (snapshotId: string) => void;
  readonly onSortColumn: (column: DriftSnapshotsTableFilterState["sortBy"]) => void;
  readonly onTableFiltersChange: (patch: Partial<DriftSnapshotsTableFilterState>) => void;
  readonly onClearFilters: () => void;
};

function formatSubscriptionCell(snapshot: InfraEvidenceSnapshotSummary): string {
  const subscription = formatInfraEvidenceSubscriptionLabel(snapshot.subscriptionName, snapshot.subscriptionId);

  return subscription ?? "—";
}

export function DriftSnapshotsTable(props: DriftSnapshotsTableProps): React.JSX.Element {
  const {
    snapshots,
    selectedSnapshotId,
    loading,
    tableFilterState,
    hasActiveFilters,
    onSelectSnapshot,
    onSortColumn,
    onTableFiltersChange,
    onClearFilters,
  } = props;

  if (loading && snapshots.length === 0) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
        {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_LOADING_LABEL}
      </p>
    );
  }

  return (
    <EnterpriseTable ariaLabel={GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_ARIA_LABEL}>
      <DriftSnapshotsTableHead
        tableFilterState={tableFilterState}
        hasActiveFilters={hasActiveFilters}
        onSortColumn={onSortColumn}
        onTableFiltersChange={onTableFiltersChange}
        onClearFilters={onClearFilters}
      />
      <EnterpriseTableBody data-testid="infra-drift-snapshots-body">
        {snapshots.map((snapshot) => {
          const isSelected = selectedSnapshotId === snapshot.snapshotId;
          const subscriptionLabel = formatSubscriptionCell(snapshot);
          const capturedLabel = formatInfraEvidenceSnapshotCapturedLabel(snapshot.capturedUtc);

          return (
            <EnterpriseTableRow
              key={snapshot.snapshotId}
              data-testid={`infra-drift-snapshot-row-${snapshot.snapshotId}`}
              selected={isSelected}
              tabIndex={0}
              aria-selected={isSelected}
              className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
              onClick={() => {
                onSelectSnapshot(snapshot.snapshotId);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectSnapshot(snapshot.snapshotId);
                }
              }}
            >
              <EnterpriseTableCell>{subscriptionLabel}</EnterpriseTableCell>
              <EnterpriseTableCell>{capturedLabel}</EnterpriseTableCell>
              <EnterpriseTableCell>{snapshot.resourceCount}</EnterpriseTableCell>
              <EnterpriseTableCell>{snapshot.relationshipCount}</EnterpriseTableCell>
              <EnterpriseTableCell>
                {isSelected ? (
                  <span
                    className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid={`infra-drift-snapshot-selected-${snapshot.snapshotId}`}
                  >
                    {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECTED_LABEL}
                  </span>
                ) : (
                  <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECT_ACTION_LABEL}
                  </span>
                )}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
