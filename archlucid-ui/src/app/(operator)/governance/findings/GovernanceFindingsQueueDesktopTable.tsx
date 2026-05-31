"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { SeverityTag } from "@/components/ui/severity-tag";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import {
  BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA,
  BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA,
} from "@/lib/buyer-polish-copy";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";

import {
  formatGovernanceQueueRecordKind,
  type GovernanceFindingQueueRow,
} from "./governance-finding-queue-row";

function inspectHref(runId: string, findingId: string): string {
  return `/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}/inspect`;
}

function manifestRecordHref(runId: string, manifestId: string): string {
  if (manifestId !== "—") {
    return `/manifests/${encodeURIComponent(manifestId)}`;
  }

  return `/reviews/${encodeURIComponent(runId)}/manifest`;
}

function governanceQueueGraphEvidenceHref(row: GovernanceFindingQueueRow): string | null {
  if (row.recordKind !== "finding") {
    return null;
  }

  const focused = preferredGraphNodeIdForFindingDeepLink(row.runId, row.findingId);

  if (focused !== null) {
    return graphTrailHrefWithOptionalNode(row.runId, focused);
  }

  const level = row.traceConfidenceLevel;

  if (level === "High" || level === "Medium" || level === "Low") {
    return graphTrailHrefWithOptionalNode(row.runId, null);
  }

  return null;
}

function governanceQueueSeverityCell(row: GovernanceFindingQueueRow, buyerPolishedShell: boolean): ReactElement {
  if (buyerPolishedShell && row.recordKind === "decision") {
    return (
      <span className="text-al-text-secondary">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Severity does not apply to recorded decision rows.</span>
      </span>
    );
  }

  if (row.recordKind === "finding") {
    return <SeverityTag severity={row.severity} />;
  }

  return <span className="text-al-text-primary">{row.severity}</span>;
}

export type GovernanceFindingsQueueDesktopTableProps = {
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly buyerPolishedShell: boolean;
};

/** Carbon-style desktop queue for architecture risks and recorded decisions (md+). */
export function GovernanceFindingsQueueDesktopTable(
  props: GovernanceFindingsQueueDesktopTableProps,
): ReactElement {
  const { rows, buyerPolishedShell } = props;
  const ariaLabel = buyerPolishedShell
    ? "Review records and dispositions"
    : "Architecture risk register";

  return (
    <div className="hidden md:block">
      <EnterpriseTable ariaLabel={ariaLabel}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
            {buyerPolishedShell ? <EnterpriseTableHeaderCell>Confidence</EnterpriseTableHeaderCell> : null}
            <EnterpriseTableHeaderCell>{buyerPolishedShell ? "Record" : "Record kind"}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>{buyerPolishedShell ? "Record summary" : "Finding"}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
            {buyerPolishedShell ? null : <EnterpriseTableHeaderCell>Manifest</EnterpriseTableHeaderCell>}
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            {buyerPolishedShell ? null : <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>}
            {buyerPolishedShell ? null : <EnterpriseTableHeaderCell>Aging</EnterpriseTableHeaderCell>}
            <EnterpriseTableHeaderCell>Recommended action</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {rows.map((row) => {
            const graphHref = governanceQueueGraphEvidenceHref(row);

            return (
              <EnterpriseTableRow key={`${row.runId}:${row.findingId}:table`}>
                <EnterpriseTableCell>{governanceQueueSeverityCell(row, buyerPolishedShell)}</EnterpriseTableCell>
                {buyerPolishedShell ? (
                  <EnterpriseTableCell>
                    {row.recordKind === "decision" ? (
                      <span className="text-al-text-secondary">—</span>
                    ) : row.traceConfidenceLevel === "High" ||
                      row.traceConfidenceLevel === "Medium" ||
                      row.traceConfidenceLevel === "Low" ? (
                      <FindingConfidenceBadge level={row.traceConfidenceLevel} />
                    ) : (
                      <span className="text-al-text-secondary">—</span>
                    )}
                  </EnterpriseTableCell>
                ) : null}
                <EnterpriseTableCell className="text-al-text-primary">
                  {formatGovernanceQueueRecordKind(row.recordKind, buyerPolishedShell)}
                </EnterpriseTableCell>
                <EnterpriseTableCell className="font-medium text-al-text-primary">
                  <Link
                    className="font-medium text-teal-800 underline dark:text-teal-300"
                    href={inspectHref(row.runId, row.findingId)}
                  >
                    {row.title}
                  </Link>
                  {buyerPolishedShell ? null : (
                    <div className="mt-0.5 font-mono text-[11px] font-normal text-al-text-secondary">
                      {row.findingId}
                    </div>
                  )}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <Link
                    className="font-medium text-teal-800 underline dark:text-teal-300"
                    href={`/reviews/${encodeURIComponent(row.runId)}`}
                  >
                    {row.runLabel}
                  </Link>
                </EnterpriseTableCell>
                {buyerPolishedShell ? null : (
                  <EnterpriseTableCell className="font-mono text-xs">
                    <Link
                      className="font-sans font-medium text-teal-800 underline dark:text-teal-300"
                      href={manifestRecordHref(row.runId, row.manifestId)}
                    >
                      Open manifest
                    </Link>
                  </EnterpriseTableCell>
                )}
                <EnterpriseTableCell>
                  {row.status}
                  {row.isStale ? (
                    <span className="ml-1 rounded border border-amber-600/40 bg-al-surface-raised px-1.5 py-0.5 text-[10px] font-semibold uppercase text-al-text-primary dark:border-amber-700/50">
                      Stale
                    </span>
                  ) : null}
                </EnterpriseTableCell>
                {buyerPolishedShell ? null : (
                  <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
                    {row.recordKind === "finding" ? row.ownerUserId ?? "—" : "—"}
                  </EnterpriseTableCell>
                )}
                {buyerPolishedShell ? null : (
                  <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
                    {row.recordKind === "finding" && row.agingDays !== undefined
                      ? `${row.agingDays}d`
                      : "—"}
                  </EnterpriseTableCell>
                )}
                <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
                  {row.recommended}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" size="sm" className="h-8">
                      <Link href={inspectHref(row.runId, row.findingId)}>
                        {buyerPolishedShell
                          ? row.recordKind === "decision"
                            ? "View decision"
                            : BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA
                          : "Open"}
                      </Link>
                    </Button>
                    {graphHref !== null ? (
                      <Button asChild variant="outline" size="sm" className="h-8">
                        <Link href={graphHref}>{BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA}</Link>
                      </Button>
                    ) : null}
                  </div>
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
