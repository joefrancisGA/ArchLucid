"use client";

import { memo, type ReactElement } from "react";

import { GovernanceFindingsBulkActions } from "@/components/usability/GovernanceFindingsBulkActions";
import { BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE } from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { GovernanceFindingsQueueDesktopTable } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueDesktopTable";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
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

  if (buyerPolishedShell) {
    return (
      <div className="space-y-4">
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
      {selectedFindingIds.size > 0 ? (
        <div className="mb-2">
          <GovernanceFindingsBulkActions
            selectedFindingIds={Array.from(selectedFindingIds)}
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
      />

      <div className="space-y-3 md:hidden" data-testid="governance-findings-queue-mobile">
        {displayedRows.map((row) => (
          <GovernanceFindingRow
            key={`${row.runId}:${row.findingId}`}
            row={row}
            buyerPolishedShell={buyerPolishedShell}
            variant="operational"
          />
        ))}
      </div>
    </>
  );
}

export const GovernanceFindingsList = memo(GovernanceFindingsListComponent);
