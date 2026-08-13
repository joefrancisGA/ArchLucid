"use client";

import { memo, useState, type ReactElement } from "react";

import { GovernanceFindingsBulkActions } from "@/components/usability/GovernanceFindingsBulkActions";
import { ReversibleMutationSuccessCallout } from "@/components/operator/ReversibleMutationSuccessCallout";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { resolveGovernanceQueueRowActivityAtUtc } from "@/lib/findings/finding-activity-at-utc";
import {
  governanceQueueRowWatermarkKey,
  isActivityNewSinceLastVisit,
  markLastVisitedNow,
} from "@/lib/usability/last-visited-watermark";
import { BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE } from "@/lib/governance/governance-mutation-outcome-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { GovernanceFindingsQueueDesktopTable } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueDesktopTable";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { FindingKeyboardTriageHost } from "@/components/governance/findings/FindingKeyboardTriageHost";
import { GovernanceFindingRow } from "@/components/governance/findings/GovernanceFindingRow";

export type GovernanceFindingsListProps = {
  readonly displayedRows: readonly GovernanceFindingQueueRow[];
  readonly buyerPolishedShell: boolean;
  readonly groupByResource: boolean;
  readonly selectedFindingIds: ReadonlySet<string>;
  readonly onSelectionChange: (next: ReadonlySet<string>) => void;
  readonly onBulkApplied: () => void;
};

function GovernanceFindingsListComponent(props: GovernanceFindingsListProps): ReactElement {
  const {
    displayedRows,
    buyerPolishedShell,
    groupByResource,
    selectedFindingIds,
    onSelectionChange,
    onBulkApplied,
  } = props;

  const findingRows = displayedRows.filter((row) => row.recordKind === "finding");
  const decisionRows = displayedRows.filter((row) => row.recordKind === "decision");
  const [bulkDispositionSuccessMessage, setBulkDispositionSuccessMessage] = useState<string | null>(null);
  const [bulkDispositionUndo, setBulkDispositionUndo] = useState<(() => Promise<void>) | null>(null);
  const [bulkDispositionUndoBusy, setBulkDispositionUndoBusy] = useState(false);

  function isGovernanceRowNewSinceLastVisit(row: GovernanceFindingQueueRow): boolean {
    const activityAt = resolveGovernanceQueueRowActivityAtUtc(row.lastReviewedUtc, row.revisitDueUtc);

    return isActivityNewSinceLastVisit(governanceQueueRowWatermarkKey(row.runId, row.findingId), activityAt);
  }

  function markGovernanceRowSeen(row: GovernanceFindingQueueRow): void {
    const activityAt = resolveGovernanceQueueRowActivityAtUtc(row.lastReviewedUtc, row.revisitDueUtc);

    markLastVisitedNow(governanceQueueRowWatermarkKey(row.runId, row.findingId), activityAt);
  }

  function resolveFindingRunId(findingId: string): string | null {
    const match = displayedRows.find(
      (row) => row.recordKind === "finding" && row.findingId === findingId,
    );

    return match?.runId ?? null;
  }

  if (buyerPolishedShell) {
    return (
      <div className="space-y-4">
        <FindingKeyboardTriageHost resolveRunId={resolveFindingRunId} onApplied={onBulkApplied} />
        {findingRows.length > 0 ? (
          <section className="space-y-3" aria-labelledby="governance-findings-risks">
            <h2
              id="governance-findings-risks"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE}
            </h2>
            <div className="space-y-3">
              {findingRows.map((row) => (
                <GovernanceFindingRow
                  key={`${row.runId}:${row.findingId}:mfind`}
                  row={row}
                  buyerPolishedShell={buyerPolishedShell}
                  variant="buyer"
                  showNewSinceLastVisit={isGovernanceRowNewSinceLastVisit(row)}
                  onOpenRow={() => {
                    markGovernanceRowSeen(row);
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}
        {decisionRows.length > 0 ? (
          <section className="space-y-3" aria-labelledby="governance-findings-decisions">
            <h2
              id="governance-findings-decisions"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Recorded decisions
            </h2>
            <div className="space-y-3">
              {decisionRows.map((row) => (
                <GovernanceFindingRow
                  key={`${row.runId}:${row.findingId}:mdec`}
                  row={row}
                  buyerPolishedShell={buyerPolishedShell}
                  variant="buyer"
                  showNewSinceLastVisit={isGovernanceRowNewSinceLastVisit(row)}
                  onOpenRow={() => {
                    markGovernanceRowSeen(row);
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <FindingKeyboardTriageHost resolveRunId={resolveFindingRunId} onApplied={onBulkApplied} />
      {bulkDispositionSuccessMessage !== null ? (
        <ReversibleMutationSuccessCallout
          message={bulkDispositionSuccessMessage}
          mutationId="governance_bulk_disposition"
          testId="governance-bulk-disposition-success-callout"
          className="mb-2"
          undoBusy={bulkDispositionUndoBusy}
          onDismiss={() => {
            setBulkDispositionSuccessMessage(null);
            setBulkDispositionUndo(null);
          }}
          onUndo={
            bulkDispositionUndo !== null
              ? async () => {
                  setBulkDispositionUndoBusy(true);

                  try {
                    await bulkDispositionUndo();
                    setBulkDispositionSuccessMessage(null);
                    setBulkDispositionUndo(null);
                  } catch (undoError) {
                    setBulkDispositionSuccessMessage(
                      undoError instanceof Error
                        ? undoError.message
                        : GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE,
                    );
                    setBulkDispositionUndo(null);
                  } finally {
                    setBulkDispositionUndoBusy(false);
                  }
                }
              : undefined
          }
        />
      ) : null}

      {selectedFindingIds.size > 0 ? (
        <div className="mb-2">
          <GovernanceFindingsBulkActions
            selectedFindingIds={Array.from(selectedFindingIds)}
            onDispositionSucceeded={(message, undo) => {
              setBulkDispositionSuccessMessage(message);
              setBulkDispositionUndo(undo ?? null);
            }}
            onApplied={onBulkApplied}
          />
        </div>
      ) : null}
      <GovernanceFindingsQueueDesktopTable
        rows={displayedRows}
        buyerPolishedShell={buyerPolishedShell}
        groupByResource={groupByResource}
        selectedFindingIds={selectedFindingIds}
        onSelectionChange={onSelectionChange}
        isRowNewSinceLastVisit={isGovernanceRowNewSinceLastVisit}
        onRowOpened={markGovernanceRowSeen}
      />

      <div className="space-y-3 md:hidden" data-testid="governance-findings-queue-mobile">
        {displayedRows.map((row) => (
          <GovernanceFindingRow
            key={`${row.runId}:${row.findingId}`}
            row={row}
            buyerPolishedShell={buyerPolishedShell}
            variant="operational"
            showNewSinceLastVisit={isGovernanceRowNewSinceLastVisit(row)}
            onOpenRow={() => {
              markGovernanceRowSeen(row);
            }}
          />
        ))}
      </div>
    </>
  );
}

export const GovernanceFindingsList = memo(GovernanceFindingsListComponent);
