import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
import {
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
} from "@/components/ui/enterprise-table";
import { governanceFindingsQueueRecordColumnLabel } from "@/lib/governance/governance-assigned-to-me-queue-copy";
import type { GovernanceAssignedToMeQueueSortKey } from "@/lib/governance/governance-assigned-to-me-queue-sort";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import {
  GOVERNANCE_FINDINGS_QUEUE_SEVERITY_STICKY_CLASS,
  GOVERNANCE_FINDINGS_QUEUE_TITLE_STICKY_CLASS,
} from "@/lib/governance/governance-queue-sticky-identity";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { GovernanceFindingsQueueSortHeaderCell } from "./GovernanceFindingsQueueSortHeaderCell";

export function GovernanceFindingsQueueTableHead(props: {
  readonly buyerPolishedShell: boolean;
  readonly queueMode: GovernanceFindingsQueueMode;
  readonly hasBulkSelect: boolean;
  readonly allSelected: boolean;
  readonly someSelected: boolean;
  readonly onToggleAll: () => void;
  readonly sticky?: boolean;
  readonly assignedToMeSortKey?: GovernanceAssignedToMeQueueSortKey;
  readonly assignedToMeSortAsc?: boolean;
  readonly onAssignedToMeSort?: (sortKey: GovernanceAssignedToMeQueueSortKey) => void;
}): ReactElement {
  const {
    buyerPolishedShell,
    queueMode,
    hasBulkSelect,
    allSelected,
    someSelected,
    onToggleAll,
    sticky,
    assignedToMeSortKey = "severity",
    assignedToMeSortAsc = true,
    onAssignedToMeSort,
  } = props;
  const isAssignedToMe = queueMode === "assigned-to-me";

  return (
    <EnterpriseTableHead
      className={
        sticky
          ? "sticky top-0 z-[1] bg-al-surface-raised shadow-[0_1px_0_0_rgb(229_229_229)] dark:shadow-[0_1px_0_0_rgb(38_38_38)]"
          : undefined
      }
    >
      <EnterpriseTableHeadRow>
        {hasBulkSelect ? (
          <EnterpriseTableHeaderCell className="w-8">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-teal-700 dark:border-neutral-600"
              aria-label={allSelected ? "Deselect all findings" : "Select all findings on this page"}
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someSelected && !allSelected;
                }
              }}
              onChange={onToggleAll}
            />
          </EnterpriseTableHeaderCell>
        ) : null}
        {buyerPolishedShell ? (
          <>
            <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Confidence</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                How strongly the available evidence supports this finding.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Record</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                Findings need action. Decisions record what was decided.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Record summary</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Recommended action</EnterpriseTableHeaderCell>
          </>
        ) : isAssignedToMe ? (
          <>
            <GovernanceFindingsQueueSortHeaderCell
              label={governanceFindingsQueueRecordColumnLabel(queueMode)}
              sortKey="title"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              className={GOVERNANCE_FINDINGS_QUEUE_TITLE_STICKY_CLASS}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <GovernanceFindingsQueueSortHeaderCell
              label="Source review"
              sortKey="sourceReview"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <GovernanceFindingsQueueSortHeaderCell
              label="Severity"
              sortKey="severity"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              className={GOVERNANCE_FINDINGS_QUEUE_SEVERITY_STICKY_CLASS}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <GovernanceFindingsQueueSortHeaderCell
              label="Due / revisit"
              sortKey="due"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <EnterpriseTableHeaderCell>Disposition</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          </>
        ) : (
          <>
            <EnterpriseTableHeaderCell className={GOVERNANCE_FINDINGS_QUEUE_TITLE_STICKY_CLASS}>Risk</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Source review</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell className={GOVERNANCE_FINDINGS_QUEUE_SEVERITY_STICKY_CLASS}>Severity</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Disposition</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Age</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                Days since the finding was opened.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Exception expiry</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                Active risk exception ends on this date.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Last decision</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                Last time this finding was reviewed in this queue.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          </>
        )}
        <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
    </EnterpriseTableHead>
  );
}
