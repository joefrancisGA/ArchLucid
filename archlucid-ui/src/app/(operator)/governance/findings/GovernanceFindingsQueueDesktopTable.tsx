"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
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
  BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA,
} from "@/lib/buyer-polish-copy";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";
import { useEnterpriseTableKeyboardNav } from "@/hooks/use-enterprise-table-keyboard-nav";
import { cn } from "@/lib/utils";

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
  /** When provided, the table renders a leading checkbox column for bulk selection. */
  readonly selectedFindingIds?: ReadonlySet<string>;
  readonly onSelectionChange?: (ids: ReadonlySet<string>) => void;
};

/** Carbon-style desktop queue for architecture risks and recorded decisions (md+). */
export function GovernanceFindingsQueueDesktopTable(
  props: GovernanceFindingsQueueDesktopTableProps,
): ReactElement {
  const { rows, buyerPolishedShell, selectedFindingIds, onSelectionChange } = props;
  const router = useRouter();
  const hasBulkSelect = selectedFindingIds !== undefined && onSelectionChange !== undefined;
  const allSelected = hasBulkSelect && rows.length > 0 && rows.every((r) => selectedFindingIds.has(r.findingId));
  const someSelected = hasBulkSelect && rows.some((r) => selectedFindingIds.has(r.findingId));

  const keyboardNav = useEnterpriseTableKeyboardNav({
    rowCount: rows.length,
    onActivateRow: (index) => {
      const row = rows[index];

      if (row === undefined) {
        return;
      }

      router.push(inspectHref(row.runId, row.findingId));
    },
  });

  function toggleRow(findingId: string) {
    if (!hasBulkSelect) return;
    const next = new Set(selectedFindingIds);

    if (next.has(findingId)) {
      next.delete(findingId);
    } else {
      next.add(findingId);
    }

    onSelectionChange(next);
  }

  function toggleAll() {
    if (!hasBulkSelect) return;

    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(rows.map((r) => r.findingId)));
    }
  }

  const ariaLabel = buyerPolishedShell
    ? "Review records and dispositions"
    : "Architecture risk register";

  return (
    <div
      className="hidden md:block"
      tabIndex={0}
      role="region"
      aria-label={ariaLabel}
      onKeyDown={keyboardNav.onTableKeyDown}
      data-testid="governance-findings-queue-keyboard-region"
    >
      <p className={cn("mb-2 text-neutral-500", DESIGN_TOKENS.table.cellSecondary)} aria-hidden="true">
        <kbd className="rounded border border-neutral-300 px-1 font-mono text-[10px] dark:border-neutral-600">j</kbd>
        /
        <kbd className="rounded border border-neutral-300 px-1 font-mono text-[10px] dark:border-neutral-600">k</kbd>
        {" move rows · "}
        <kbd className="rounded border border-neutral-300 px-1 font-mono text-[10px] dark:border-neutral-600">Enter</kbd>
        {" open finding"}
      </p>
      <EnterpriseTable ariaLabel={ariaLabel}>
        <EnterpriseTableHead>
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
                  onChange={toggleAll}
                />
              </EnterpriseTableHeaderCell>
            ) : null}
            <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
            {buyerPolishedShell ? <EnterpriseTableHeaderCell>Confidence</EnterpriseTableHeaderCell> : null}
            <EnterpriseTableHeaderCell>{buyerPolishedShell ? "Record" : "Record kind"}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>{buyerPolishedShell ? "Record summary" : "Finding"}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
            {buyerPolishedShell ? null : <EnterpriseTableHeaderCell>{SIGNED_MANIFEST_LABEL}</EnterpriseTableHeaderCell>}
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            {buyerPolishedShell ? null : <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>}
            {buyerPolishedShell ? null : <EnterpriseTableHeaderCell>Aging</EnterpriseTableHeaderCell>}
            <EnterpriseTableHeaderCell>Recommended action</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {rows.map((row, rowIndex) => {
            const graphHref = governanceQueueGraphEvidenceHref(row);
            const evidenceChipHref =
              graphHref ??
              (row.evidenceHref !== undefined && row.evidenceHref.trim().length > 0 ? row.evidenceHref : null);

            return (
              <EnterpriseTableRow
                key={`${row.runId}:${row.findingId}:table`}
                className={keyboardNav.isRowFocused(rowIndex) ? "ring-2 ring-inset ring-teal-700/40 dark:ring-teal-400/40" : undefined}
              >
                {hasBulkSelect ? (
                  <EnterpriseTableCell className="w-8">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-teal-700 dark:border-neutral-600"
                      aria-label={`Select finding: ${row.title}`}
                      checked={selectedFindingIds.has(row.findingId)}
                      onChange={() => { toggleRow(row.findingId); }}
                      onClick={(e) => { e.stopPropagation(); }}
                    />
                  </EnterpriseTableCell>
                ) : null}
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
                  {row.category && row.recordKind === "finding" ? (
                    <div className="mt-0.5 text-[11px] font-normal text-al-text-secondary">
                      Policy area: {row.category}
                    </div>
                  ) : null}
                  {buyerPolishedShell ? null : (
                    <div className="mt-0.5 flex flex-wrap items-center gap-1 font-mono text-[11px] font-normal text-al-text-secondary">
                      <span>{row.findingId}</span>
                      <CopyIdButton value={row.findingId} aria-label="Copy finding ID" />
                    </div>
                  )}
                  {evidenceChipHref !== null ? (
                    <div className="mt-1">
                      <FindingEvidenceLinkChip
                        href={evidenceChipHref}
                        evidenceRefCount={row.evidenceRefCount}
                      />
                    </div>
                  ) : null}
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
                      Open signed record
                    </Link>
                  </EnterpriseTableCell>
                )}
                <EnterpriseTableCell>
                  <div>{row.status}</div>
                  {row.recordKind === "finding" && row.humanReviewStatusLabel ? (
                    <div className="mt-0.5 text-[11px] text-al-text-secondary">{row.humanReviewStatusLabel}</div>
                  ) : null}
                  {row.recordKind === "finding" && row.itsmLinkedTicketsSummary ? (
                    <div className="mt-0.5 font-mono text-[11px] text-al-text-secondary">
                      ITSM: {row.itsmLinkedTicketsSummary}
                    </div>
                  ) : null}
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
                    {!buyerPolishedShell && row.recordKind === "finding" ? (
                      <ItsmOutboundQuickActions findingId={row.findingId} compact />
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
