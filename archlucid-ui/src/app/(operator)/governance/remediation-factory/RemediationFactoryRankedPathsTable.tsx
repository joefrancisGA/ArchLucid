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
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  formatSecurityEvidencePathConfidenceBandLabel,
  securityEvidencePathConfidenceBandStatusKind,
} from "@/lib/security-evidence-path-presentation";
import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";
import { SECURENOW_PATH_RANKED_PATHS_TITLE } from "@/lib/product-line/securenow-path-inspect-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

import { RemediationFactoryTableSummaryCell } from "./RemediationFactoryTableSummaryCell";

export function RemediationFactoryRankedPathsTable(props: {
  readonly rows: ReadonlyArray<SecurityEvidencePathRankSummary>;
  readonly selectedPathId: string | null;
  readonly onSelect: (pathId: string) => void;
  readonly scopeLabel: string;
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange?: (page: number) => void;
}) {
  const showing = props.rows.length;
  const rankSource = "Server rank (composite sort)";

  return (
    <div className="space-y-2">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="remediation-factory-ranked-paths-scope">
        {props.scopeLabel} · {rankSource} · Showing page {props.page} ({showing} rows) of {props.totalCount}
      </p>
      {props.totalCount > props.pageSize && props.onPageChange !== undefined ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={props.page <= 1}
            onClick={() => props.onPageChange?.(props.page - 1)}
            data-testid="remediation-factory-ranked-paths-prev-page"
          >
            Previous page
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={props.page * props.pageSize >= props.totalCount}
            onClick={() => props.onPageChange?.(props.page + 1)}
            data-testid="remediation-factory-ranked-paths-next-page"
          >
            Next page
          </Button>
        </div>
      ) : null}
      <EnterpriseTable ariaLabel={SECURENOW_PATH_RANKED_PATHS_TITLE} role="grid">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Rank</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Kind</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Band</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Score</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {props.rows.map((row) => {
            const selected = props.selectedPathId === row.pathId;

            return (
              <EnterpriseTableInteractiveRow
                key={row.pathId}
                data-testid={`security-evidence-ranked-path-row-${row.pathId}`}
                data-remediation-factory-row-id={row.pathId}
                selected={selected}
                onActivate={() => props.onSelect(row.pathId)}
              >
                <EnterpriseTableCell className="tabular-nums text-right">
                  <span className="inline-flex items-center gap-2">
                    {row.rankOrder}
                    {selected ? <StatusTag kind="ready" label="Inspecting" /> : null}
                  </span>
                </EnterpriseTableCell>
                <EnterpriseTableCell>{row.pathKind}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <StatusTag
                    kind={securityEvidencePathConfidenceBandStatusKind(row.pathConfidenceBand)}
                    label={formatSecurityEvidencePathConfidenceBandLabel(row.pathConfidenceBand)}
                  />
                </EnterpriseTableCell>
                <EnterpriseTableCell className="tabular-nums">{row.compositeSortScore.toFixed(4)}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <RemediationFactoryTableSummaryCell rowKey={row.pathId} summary={row.explanationSummary} />
                </EnterpriseTableCell>
              </EnterpriseTableInteractiveRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
