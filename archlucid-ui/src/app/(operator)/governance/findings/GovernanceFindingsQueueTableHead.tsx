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
            <EnterpriseTableHeaderCell>
              <span>Severity</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                How serious this finding is recorded as.
              </span>
            </EnterpriseTableHeaderCell>
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
            <EnterpriseTableHeaderCell>
              <span>Record summary</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                A short description of the finding or recorded decision.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Review</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                The review that recorded this finding.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Status</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                Status shows where this finding is in the review workflow.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Recommended action</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                The next recorded action for this finding.
              </span>
            </EnterpriseTableHeaderCell>
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
              helperText="The review that recorded this finding."
              sortKey="sourceReview"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <GovernanceFindingsQueueSortHeaderCell
              label="Severity"
              helperText="How serious this finding is recorded as."
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
              helperText="The date to revisit or complete this finding."
              sortKey="due"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <EnterpriseTableHeaderCell>
              <span>Disposition</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                Disposition is the recorded decision for this finding.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Status</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                Status shows where this finding is in the review workflow.
              </span>
            </EnterpriseTableHeaderCell>
          </>
        ) : (
          <>
            <EnterpriseTableHeaderCell className={GOVERNANCE_FINDINGS_QUEUE_TITLE_STICKY_CLASS}>
              <span>Risk</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                The finding title shown in this queue.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Source review</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                The review that recorded this finding.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell className={GOVERNANCE_FINDINGS_QUEUE_SEVERITY_STICKY_CLASS}>
              <span>Severity</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                How serious this finding is recorded as.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Owner</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                The person recorded as responsible for this finding.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Disposition</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                The recorded decision for this finding.
              </span>
            </EnterpriseTableHeaderCell>
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
            <EnterpriseTableHeaderCell>
              <span>Status</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                Where this finding is in the review workflow.
              </span>
            </EnterpriseTableHeaderCell>
          </>
        )}
        <EnterpriseTableHeaderCell>
          <span>Actions</span>
          <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
            Open this finding or its source review.
          </span>
        </EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
    </EnterpriseTableHead>
  );
}
