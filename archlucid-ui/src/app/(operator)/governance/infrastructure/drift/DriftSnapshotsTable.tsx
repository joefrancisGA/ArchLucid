"use client";

import { InfraEvidenceSnapshotCapturedTime } from "@/components/infra-evidence/InfraEvidenceSnapshotCapturedTime";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_ARIA_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_DELETE_ACTION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_LOADING_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECT_ACTION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECTED_LABEL,
  formatGovernanceInfrastructureDriftDeleteSnapshotAriaLabel,
} from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatInfraEvidenceSubscriptionLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import { resolveInfraEvidenceSnapshotCaptureStatusPresentation } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
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
  readonly focusedSnapshotId: string;
  readonly loading: boolean;
  readonly tableFilterState: DriftSnapshotsTableFilterState;
  readonly hasActiveFilters: boolean;
  readonly onSelectSnapshot: (snapshotId: string) => void;
  readonly onFocusSnapshot: (snapshotId: string) => void;
  readonly onSortColumn: (column: DriftSnapshotsTableFilterState["sortBy"]) => void;
  readonly onTableFiltersChange: (patch: Partial<DriftSnapshotsTableFilterState>) => void;
  readonly onClearFilters: () => void;
  readonly onDeleteSnapshot?: (snapshotId: string) => void;
  readonly deletingSnapshotId?: string | null;
};

function formatSubscriptionCell(snapshot: InfraEvidenceSnapshotSummary): string {
  const subscription = formatInfraEvidenceSubscriptionLabel(snapshot.subscriptionName, snapshot.subscriptionId);

  return subscription ?? "—";
}

export function DriftSnapshotsTable(props: DriftSnapshotsTableProps): React.JSX.Element {
  const {
    snapshots,
    selectedSnapshotId,
    focusedSnapshotId,
    loading,
    tableFilterState,
    hasActiveFilters,
    onSelectSnapshot,
    onFocusSnapshot,
    onSortColumn,
    onTableFiltersChange,
    onClearFilters,
    onDeleteSnapshot,
    deletingSnapshotId = null,
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
          const isFocused = focusedSnapshotId === snapshot.snapshotId;
          const subscriptionLabel = formatSubscriptionCell(snapshot);
          const captureStatus = resolveInfraEvidenceSnapshotCaptureStatusPresentation(snapshot.captureStatus);
          const deleteAriaLabel = formatGovernanceInfrastructureDriftDeleteSnapshotAriaLabel(subscriptionLabel);

          return (
            <EnterpriseTableRow
              key={snapshot.snapshotId}
              data-testid={`infra-drift-snapshot-row-${snapshot.snapshotId}`}
              selected={isSelected}
              tabIndex={0}
              aria-selected={isSelected}
              className={cn(
                "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400",
                isFocused ? "ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700" : null,
              )}
              onClick={() => {
                onFocusSnapshot(snapshot.snapshotId);
                onSelectSnapshot(snapshot.snapshotId);
              }}
              onFocus={() => {
                onFocusSnapshot(snapshot.snapshotId);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onFocusSnapshot(snapshot.snapshotId);
                  onSelectSnapshot(snapshot.snapshotId);
                }
              }}
            >
              <EnterpriseTableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{subscriptionLabel}</span>
                  <StatusTag
                    kind={captureStatus.kind}
                    label={captureStatus.label}
                    data-testid={`infra-drift-snapshot-capture-status-${snapshot.snapshotId}`}
                  />
                </div>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <InfraEvidenceSnapshotCapturedTime
                  capturedUtc={snapshot.capturedUtc}
                  testId={`infra-drift-snapshot-captured-${snapshot.snapshotId}`}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell className="tabular-nums">{snapshot.resourceCount}</EnterpriseTableCell>
              <EnterpriseTableCell className="tabular-nums">{snapshot.relationshipCount}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className="flex flex-wrap items-center gap-2">
                  {isSelected ? (
                    <span
                      className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`infra-drift-snapshot-selected-${snapshot.snapshotId}`}
                    >
                      {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECTED_LABEL}
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid={`infra-drift-snapshot-select-${snapshot.snapshotId}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onFocusSnapshot(snapshot.snapshotId);
                        onSelectSnapshot(snapshot.snapshotId);
                      }}
                    >
                      {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_SELECT_ACTION_LABEL}
                    </Button>
                  )}
                  {onDeleteSnapshot != null ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                      aria-label={deleteAriaLabel}
                      data-testid={`infra-drift-snapshot-delete-${snapshot.snapshotId}`}
                      disabled={deletingSnapshotId === snapshot.snapshotId}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteSnapshot(snapshot.snapshotId);
                      }}
                    >
                      {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_TABLE_DELETE_ACTION_LABEL}
                    </Button>
                  ) : null}
                </div>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
