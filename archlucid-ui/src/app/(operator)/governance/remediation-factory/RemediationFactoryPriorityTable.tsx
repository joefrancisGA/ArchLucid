"use client";

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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

import { RemediationFactoryTableSummaryCell } from "./RemediationFactoryTableSummaryCell";

export function RemediationFactoryPriorityTable(props: {
  readonly rows: ReadonlyArray<RemediationPrioritizedFinding>;
  readonly selectedFindingId: string | null;
  readonly onSelect: (findingId: string) => void;
  readonly scopeLabel: string;
  readonly totalCount: number;
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
            <EnterpriseTableHeaderCell>Rank</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Score</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Control</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Pattern</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {props.rows.map((row, index) => {
            const rankOrder = row.rankOrder ?? index + 1;
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
                    {rankOrder}
                    {selected ? <StatusTag kind="ready" label="Inspecting" /> : null}
                  </span>
                </EnterpriseTableCell>
                <EnterpriseTableCell className="tabular-nums">{row.totalScore.toFixed(4)}</EnterpriseTableCell>
                <EnterpriseTableCell>{row.controlId ?? "—"}</EnterpriseTableCell>
                <EnterpriseTableCell>{row.patternKey ?? "—"}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <RemediationFactoryTableSummaryCell rowKey={row.findingId} summary={row.explanationSummary} />
                </EnterpriseTableCell>
              </EnterpriseTableInteractiveRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
