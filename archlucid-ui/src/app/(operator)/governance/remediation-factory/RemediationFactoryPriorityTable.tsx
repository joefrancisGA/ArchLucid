"use client";

import Link from "next/link";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableInteractiveRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import type { RemediationPrioritizedFinding } from "@/lib/remediation-factory-types";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { buildRemediationWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-workbench-url";
import {
  formatRemediationPriorityWhenBandForQueueRow,
  REMEDIATION_PRIORITY_WHEN_HEADER_HELPER,
  resolveRemediationPriorityQueueRankOrder,
} from "@/lib/remediation-priority-when-band";

const REMEDIATION_CONTROL_ID_NOT_STORED = "Control id was not stored.";

function formatRemediationPriorityControlId(controlId: string | null | undefined): string {
  if (controlId === null || controlId === undefined || controlId.trim().length === 0) {
    return REMEDIATION_CONTROL_ID_NOT_STORED;
  }

  return controlId;
}
import { cn } from "@/lib/utils";

import { RemediationFactoryPatternKeyCell } from "./RemediationFactoryPatternKeyCell";
import { RemediationPriorityReasonCell } from "./RemediationPriorityReasonCell";
import { RemediationPriorityResourceCell } from "./RemediationPriorityResourceCell";
import { RemediationPrioritySortKeyDisclosure } from "./RemediationPrioritySortKeyDisclosure";

export function RemediationFactoryPriorityTable(props: {
  readonly rows: ReadonlyArray<RemediationPrioritizedFinding>;
  readonly selectedFindingId: string | null;
  readonly onSelect: (findingId: string) => void;
  readonly scopeLabel: string;
  readonly totalCount: number;
  readonly workbenchSnapshotId: string | null;
}) {
  const showing = props.rows.length;

  return (
    <div className="space-y-2">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="remediation-factory-priority-scope">
        {props.scopeLabel} · Showing top {showing} of {props.totalCount} ranked findings
      </p>
      <EnterpriseTable ariaLabel="Remediation priority queue" role="grid">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>
              <span>Rank</span>
              <span
                className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="remediation-factory-priority-rank-header-helper"
              >
                This rank is the SecureNow finding queue, not the path list.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Resource</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>When</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                {REMEDIATION_PRIORITY_WHEN_HEADER_HELPER}
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Score</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                Sort key for this queue. Not a percentage.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Control</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                The control this finding cites.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span>Pattern</span>
              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                A named finding pattern. The key stays with the finding.
              </span>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Workbench</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {props.rows.map((row, rowIndex) => {
            const storedRankOrder = row.rankOrder;
            const oneBasedRowIndex = rowIndex + 1;
            const queueRankOrder = resolveRemediationPriorityQueueRankOrder(storedRankOrder, oneBasedRowIndex);
            const selected = props.selectedFindingId === row.findingId;

            return (
              <EnterpriseTableInteractiveRow
                key={row.findingId}
                data-testid={`remediation-priority-row-${row.findingId}`}
                data-remediation-factory-row-id={row.findingId}
                selected={selected}
                onActivate={() => props.onSelect(row.findingId)}
              >
                <EnterpriseTableCell className="tabular-nums text-right">
                  <span className="inline-flex items-center gap-2">
                    {storedRankOrder ?? queueRankOrder}
                    {selected ? <StatusTag kind="ready" label="Inspecting" /> : null}
                  </span>
                </EnterpriseTableCell>
                <RemediationPriorityResourceCell findingId={row.findingId} cloudResourceId={row.cloudResourceId} />
                <EnterpriseTableCell>
                  {formatRemediationPriorityWhenBandForQueueRow(storedRankOrder, oneBasedRowIndex)}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <RemediationPrioritySortKeyDisclosure findingId={row.findingId} totalScore={row.totalScore} />
                </EnterpriseTableCell>
                <EnterpriseTableCell>{formatRemediationPriorityControlId(row.controlId)}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <RemediationFactoryPatternKeyCell
                    findingId={row.findingId}
                    patternKey={row.patternKey}
                    emptyLabel="Name not recorded"
                  />
                </EnterpriseTableCell>
                <RemediationPriorityReasonCell
                  findingId={row.findingId}
                  breakdownJson={row.breakdownJson}
                  explanationSummary={row.explanationSummary}
                />
                <EnterpriseTableCell>
                  <Link
                    className={OPERATOR_LINK.inline}
                    data-testid={`remediation-priority-workbench-${row.findingId}`}
                    href={buildRemediationWorkbenchHref({
                      findingId: row.findingId,
                      cloudResourceId: row.cloudResourceId ?? undefined,
                      snapshotId: props.workbenchSnapshotId ?? undefined,
                    })}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    Open remediation workbench
                  </Link>
                </EnterpriseTableCell>
              </EnterpriseTableInteractiveRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
