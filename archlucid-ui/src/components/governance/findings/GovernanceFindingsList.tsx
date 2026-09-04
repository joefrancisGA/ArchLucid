"use client";

import { memo, useState, type ReactElement } from "react";
import { useSearchParams } from "next/navigation";

import { GovernanceFindingsBulkActions } from "@/components/usability/GovernanceFindingsBulkActions";
import { GovernanceRecordCorrectionDialog } from "@/components/governance/GovernanceRecordCorrectionDialog";
import { useGovernanceRecordCorrectionUrlSync } from "@/hooks/use-governance-record-correction-url-sync";
import { ReversibleMutationSuccessCallout } from "@/components/operator/ReversibleMutationSuccessCallout";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { GovernanceFindingTriagePanel } from "@/components/governance/findings/GovernanceFindingTriagePanel";
import { useGovernanceFindingTriageWithCursor } from "@/components/governance/findings/use-governance-finding-triage-with-cursor";
import { resolveGovernanceQueueRowActivityAtUtc } from "@/lib/findings/finding-activity-at-utc";
import {
  governanceQueueRowWatermarkKey,
  isActivityNewSinceLastVisit,
  markLastVisitedNow,
} from "@/lib/usability/last-visited-watermark";
import { BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE } from "@/lib/governance/governance-mutation-outcome-copy";
import {
  GOVERNANCE_MUTATION_CORRECTION_SUCCESS_MESSAGE,
  type GovernanceMutationCorrectionTarget,
} from "@/lib/governance/governance-mutation-correction-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";

import { GovernanceFindingsQueueDesktopTable } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueDesktopTable";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { FindingKeyboardTriageHost } from "@/components/governance/findings/FindingKeyboardTriageHost";
import { FindingListDispositionRowActions } from "@/components/governance/findings/FindingListDispositionRowActions";
import { GovernanceFindingRow } from "@/components/governance/findings/GovernanceFindingRow";

export type GovernanceFindingsListProps = {
  readonly displayedRows: readonly GovernanceFindingQueueRow[];
  readonly buyerPolishedShell: boolean;
  readonly groupByResource: boolean;
  readonly queueMode?: GovernanceFindingsQueueMode;
  readonly selectedFindingIds: ReadonlySet<string>;
  readonly onSelectionChange: (next: ReadonlySet<string>) => void;
  readonly onBulkApplied: () => void;
  readonly showInsightDensityScore?: boolean;
};

function GovernanceFindingsListComponent(props: GovernanceFindingsListProps): ReactElement {
  const {
    displayedRows,
    buyerPolishedShell,
    groupByResource,
    queueMode = "tenant",
    selectedFindingIds,
    onSelectionChange,
    onBulkApplied,
    showInsightDensityScore = false,
  } = props;

  const findingRows = displayedRows.filter((row) => row.recordKind === "finding");
  const decisionRows = displayedRows.filter((row) => row.recordKind === "decision");
  const [bulkDispositionSuccessMessage, setBulkDispositionSuccessMessage] = useState<string | null>(null);
  const [bulkDispositionUndo, setBulkDispositionUndo] = useState<(() => Promise<void>) | null>(null);
  const [bulkDispositionUndoBusy, setBulkDispositionUndoBusy] = useState(false);
  const [bulkDispositionCorrectionTarget, setBulkDispositionCorrectionTarget] =
    useState<GovernanceMutationCorrectionTarget | null>(null);
  const { correctionDialogOpen: bulkDispositionCorrectionDialogOpen, setCorrectionDialogOpen: setBulkDispositionCorrectionDialogOpen } =
    useGovernanceRecordCorrectionUrlSync({
      correctionTarget: bulkDispositionCorrectionTarget,
    });
  const [bulkDispositionCorrectionRecorded, setBulkDispositionCorrectionRecorded] = useState(false);
  const searchParams = useSearchParams();
  const triage = useGovernanceFindingTriageWithCursor(displayedRows, searchParams);

  function handleBulkApplied(): void {
    if (triage.open) {
      triage.goNext();
    }

    onBulkApplied();
  }

  function openTriageRow(row: GovernanceFindingQueueRow): void {
    markGovernanceRowSeen(row);
    triage.openForRow(row);
  }

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

  function resolveBulkDispositionCorrectionTarget(
    findingIds: readonly string[],
  ): GovernanceMutationCorrectionTarget | null {
    const firstFindingId = findingIds[0];

    if (firstFindingId === undefined) {
      return null;
    }

    const runId = resolveFindingRunId(firstFindingId);

    if (runId === null || runId.trim().length === 0) {
      return null;
    }

    return {
      mutationKind: "governance_bulk_disposition",
      subjectId: firstFindingId,
      runId: runId.trim(),
    };
  }

  function resolveBulkDispositionSuccessMessage(): string {
    if (bulkDispositionSuccessMessage === null) {
      return "";
    }

    if (!bulkDispositionCorrectionRecorded) {
      return bulkDispositionSuccessMessage;
    }

    return `${bulkDispositionSuccessMessage} ${GOVERNANCE_MUTATION_CORRECTION_SUCCESS_MESSAGE}`;
  }

  if (buyerPolishedShell) {
    return (
      <FindingKeyboardTriageHost resolveRunId={resolveFindingRunId} onApplied={handleBulkApplied}>
      <div className="space-y-4">
        <GovernanceFindingTriagePanel
          open={triage.open}
          row={triage.activeRow}
          activeIndex={triage.activeIndex}
          totalCount={triage.findingRows.length}
          buyerPolishedShell={buyerPolishedShell}
          canGoPrevious={triage.canGoPrevious}
          canGoNext={triage.canGoNext}
          onOpenChange={triage.setOpen}
          onPrevious={triage.goPrevious}
          onNext={triage.goNext}
          onRowOpened={markGovernanceRowSeen}
        />
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
                    openTriageRow(row);
                  }}
                  onOpenFinding={openTriageRow}
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
      </FindingKeyboardTriageHost>
    );
  }

  return (
    <FindingKeyboardTriageHost resolveRunId={resolveFindingRunId} onApplied={handleBulkApplied}>
    <>
      <GovernanceFindingTriagePanel
        open={triage.open}
        row={triage.activeRow}
        activeIndex={triage.activeIndex}
        totalCount={triage.findingRows.length}
        buyerPolishedShell={buyerPolishedShell}
        canGoPrevious={triage.canGoPrevious}
        canGoNext={triage.canGoNext}
        onOpenChange={triage.setOpen}
        onPrevious={triage.goPrevious}
        onNext={triage.goNext}
        onRowOpened={markGovernanceRowSeen}
      />
      {bulkDispositionSuccessMessage !== null ? (
        <ReversibleMutationSuccessCallout
          message={resolveBulkDispositionSuccessMessage()}
          mutationId="governance_bulk_disposition"
          testId="governance-bulk-disposition-success-callout"
          className="mb-2"
          undoBusy={bulkDispositionUndoBusy}
          onDismiss={() => {
            setBulkDispositionSuccessMessage(null);
            setBulkDispositionUndo(null);
            setBulkDispositionCorrectionTarget(null);
            setBulkDispositionCorrectionRecorded(false);
          }}
          onUndo={
            bulkDispositionUndo !== null
              ? async () => {
                  setBulkDispositionUndoBusy(true);

                  try {
                    await bulkDispositionUndo();
                    setBulkDispositionSuccessMessage(null);
                    setBulkDispositionUndo(null);
                    setBulkDispositionCorrectionTarget(null);
                    setBulkDispositionCorrectionRecorded(false);
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
          onRecordCorrection={
            bulkDispositionCorrectionTarget !== null
              ? () => {
                  setBulkDispositionCorrectionDialogOpen(true);
                }
              : undefined
          }
        />
      ) : null}

      <GovernanceRecordCorrectionDialog
        open={bulkDispositionCorrectionDialogOpen}
        onOpenChange={setBulkDispositionCorrectionDialogOpen}
        target={bulkDispositionCorrectionTarget}
        onRecorded={() => {
          setBulkDispositionCorrectionRecorded(true);
        }}
      />

      {selectedFindingIds.size > 0 ? (
        <div className="mb-2">
          <GovernanceFindingsBulkActions
            selectedFindingIds={Array.from(selectedFindingIds)}
            onDispositionSucceeded={(payload) => {
              setBulkDispositionSuccessMessage(payload.message);
              setBulkDispositionUndo(payload.undo ?? null);
              setBulkDispositionCorrectionRecorded(false);
              setBulkDispositionCorrectionTarget(
                resolveBulkDispositionCorrectionTarget(payload.correctionFindingIds),
              );
            }}
            onApplied={handleBulkApplied}
          />
        </div>
      ) : null}
      <GovernanceFindingsQueueDesktopTable
        rows={displayedRows}
        buyerPolishedShell={buyerPolishedShell}
        groupByResource={groupByResource}
        queueMode={queueMode}
        selectedFindingIds={selectedFindingIds}
        onSelectionChange={onSelectionChange}
        isRowNewSinceLastVisit={isGovernanceRowNewSinceLastVisit}
        onRowOpened={markGovernanceRowSeen}
        onActivateRow={(row) => {
          openTriageRow(row);
        }}
        showInsightDensityScore={showInsightDensityScore}
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
              if (row.recordKind === "finding") {
                openTriageRow(row);
                return;
              }

              markGovernanceRowSeen(row);
            }}
            onOpenFinding={openTriageRow}
          />
        ))}
      </div>
    </>
    </FindingKeyboardTriageHost>
  );
}

export const GovernanceFindingsList = memo(GovernanceFindingsListComponent);
