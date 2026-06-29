"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
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
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { CopyGovernanceQueueWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { FindingPolicyTraceabilityBadges } from "@/components/FindingPolicyTraceabilityBadges";
import { buildPolicyTraceabilityLinksFromRuleId } from "@/lib/finding-policy-evidence-citations";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";
import { groupGovernanceFindingQueueRows } from "@/lib/group-governance-finding-queue-rows";
import { useEnterpriseTableKeyboardNav } from "@/hooks/use-enterprise-table-keyboard-nav";

import {
  formatGovernanceQueueRecordKind,
  type GovernanceFindingQueueRow,
} from "./governance-finding-queue-row";

function inspectHref(runId: string, findingId: string): string {
  return `/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}/inspect`;
}

function formatRiskRegisterUtcLabel(utc: string | null | undefined): string {
  const raw = (utc ?? "").trim();

  if (raw.length === 0) {
    return "—";
  }

  const parsed = Date.parse(raw);

  if (Number.isNaN(parsed)) {
    return raw;
  }

  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function manifestRecordHref(runId: string, manifestId: string): string {
  if (manifestId !== "—") {
    return `/signed-records/${encodeURIComponent(manifestId)}`;
  }

  return `/reviews/${encodeURIComponent(runId)}/signed-record`;
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
  readonly groupByResource?: boolean;
  /** When provided, the table renders a leading checkbox column for bulk selection. */
  readonly selectedFindingIds?: ReadonlySet<string>;
  readonly onSelectionChange?: (ids: ReadonlySet<string>) => void;
};

type GovernanceFindingsQueueTableBodyProps = {
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly buyerPolishedShell: boolean;
  readonly hasBulkSelect: boolean;
  readonly selectedFindingIds?: ReadonlySet<string>;
  readonly onToggleRow?: (findingId: string) => void;
  readonly focusedRowIndex?: number;
  readonly isRowFocused?: (index: number) => boolean;
};

function GovernanceFindingsQueueTableHead(props: {
  readonly buyerPolishedShell: boolean;
  readonly hasBulkSelect: boolean;
  readonly allSelected: boolean;
  readonly someSelected: boolean;
  readonly onToggleAll: () => void;
}): ReactElement {
  const { buyerPolishedShell, hasBulkSelect, allSelected, someSelected, onToggleAll } = props;

  return (
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
              onChange={onToggleAll}
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
        {buyerPolishedShell ? null : <EnterpriseTableHeaderCell>Last reviewed</EnterpriseTableHeaderCell>}
        {buyerPolishedShell ? null : <EnterpriseTableHeaderCell>Next review</EnterpriseTableHeaderCell>}
        {buyerPolishedShell ? null : <EnterpriseTableHeaderCell>Aging</EnterpriseTableHeaderCell>}
        <EnterpriseTableHeaderCell>Recommended action</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
    </EnterpriseTableHead>
  );
}

function GovernanceFindingsQueueTableBody(props: GovernanceFindingsQueueTableBodyProps): ReactElement {
  const {
    rows,
    buyerPolishedShell,
    hasBulkSelect,
    selectedFindingIds,
    onToggleRow,
    isRowFocused,
  } = props;

  return (
    <EnterpriseTableBody>
      {rows.map((row, rowIndex) => {
        const graphHref = governanceQueueGraphEvidenceHref(row);
        const evidenceChipHref =
          graphHref ??
          (row.evidenceHref !== undefined && row.evidenceHref.trim().length > 0 ? row.evidenceHref : null);

        return (
          <EnterpriseTableRow
            key={`${row.runId}:${row.findingId}:table`}
            className={isRowFocused?.(rowIndex) ? "ring-2 ring-inset ring-teal-700/40 dark:ring-teal-400/40" : undefined}
          >
            {hasBulkSelect ? (
              <EnterpriseTableCell className="w-8">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-teal-700 dark:border-neutral-600"
                  aria-label={`Select finding: ${row.title}`}
                  checked={selectedFindingIds?.has(row.findingId) ?? false}
                  onChange={() => { onToggleRow?.(row.findingId); }}
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
                className={OPERATOR_LINK.inline}
                href={inspectHref(row.runId, row.findingId)}
              >
                {row.title}
              </Link>
              {row.recordKind === "finding" && row.policyRuleId ? (
                <div className="mt-1">
                  <FindingPolicyTraceabilityBadges
                    {...buildPolicyTraceabilityLinksFromRuleId(row.policyRuleId, row.category || row.policyRuleId)}
                  />
                </div>
              ) : row.category && row.recordKind === "finding" ? (
                <div className={cn("mt-0.5 font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                  Policy area: {row.category}
                </div>
              ) : null}
              {buyerPolishedShell ? null : (
                <div
                  className={cn(
                    "mt-0.5 flex flex-wrap items-center gap-1 font-mono font-normal text-al-text-secondary",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                >
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
                className={OPERATOR_LINK.inline}
                href={`/reviews/${encodeURIComponent(row.runId)}`}
              >
                {row.runLabel}
              </Link>
            </EnterpriseTableCell>
            {buyerPolishedShell ? null : (
              <EnterpriseTableCell className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                <Link
                  className={cn("font-sans", OPERATOR_LINK.inline)}
                  href={manifestRecordHref(row.runId, row.manifestId)}
                >
                  Open signed record
                </Link>
              </EnterpriseTableCell>
            )}
            <EnterpriseTableCell>
              <div>{row.status}</div>
              {row.recordKind === "finding" && row.humanReviewStatusLabel ? (
                <div className={cn("mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                  {row.humanReviewStatusLabel}
                </div>
              ) : null}
              {row.recordKind === "finding" && row.itsmLinkedTicketsSummary ? (
                <div className={cn("mt-0.5 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                  ITSM: {row.itsmLinkedTicketsSummary}
                </div>
              ) : null}
              {row.isStale ? (
                <span
                  className={cn(
                    "ml-1 rounded border border-amber-600/40 bg-al-surface-raised px-1.5 py-0.5 font-semibold uppercase text-al-text-primary dark:border-amber-700/50",
                    OPERATOR_TYPOGRAPHY.badge,
                  )}
                >
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
                {row.recordKind === "finding" ? formatRiskRegisterUtcLabel(row.lastReviewedUtc) : "—"}
              </EnterpriseTableCell>
            )}
            {buyerPolishedShell ? null : (
              <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
                {row.recordKind === "finding" ? formatRiskRegisterUtcLabel(row.revisitDueUtc) : "—"}
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
                {row.recordKind === "finding" ? (
                  <>
                    <CopyGovernanceQueueWorkItemButton
                      runId={row.runId}
                      findingId={row.findingId}
                      findingTitle={row.title}
                      severityLabel={row.severity}
                      recommendedAction={row.recommended}
                      statusLabel={row.status}
                      compact
                    />
                    {!buyerPolishedShell ? <ItsmOutboundQuickActions findingId={row.findingId} compact /> : null}
                  </>
                ) : null}
              </div>
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        );
      })}
    </EnterpriseTableBody>
  );
}

/** Carbon-style desktop queue for architecture risks and recorded decisions (md+). */
export function GovernanceFindingsQueueDesktopTable(
  props: GovernanceFindingsQueueDesktopTableProps,
): ReactElement {
  const {
    rows,
    buyerPolishedShell,
    groupByResource = false,
    selectedFindingIds,
    onSelectionChange,
  } = props;
  const router = useRouter();
  const hasBulkSelect = selectedFindingIds !== undefined && onSelectionChange !== undefined;
  const allSelected = hasBulkSelect && rows.length > 0 && rows.every((r) => selectedFindingIds.has(r.findingId));
  const someSelected = hasBulkSelect && rows.some((r) => selectedFindingIds.has(r.findingId));

  const keyboardNav = useEnterpriseTableKeyboardNav({
    rowCount: groupByResource ? 0 : rows.length,
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

  function toggleAll(scopeRows: readonly GovernanceFindingQueueRow[] = rows) {
    if (!hasBulkSelect) return;

    const scopeIds = new Set(scopeRows.map((row) => row.findingId));
    const allScopeSelected =
      scopeRows.length > 0 && scopeRows.every((row) => selectedFindingIds.has(row.findingId));

    if (allScopeSelected) {
      const next = new Set(selectedFindingIds);

      for (const id of scopeIds) {
        next.delete(id);
      }

      onSelectionChange(next);
      return;
    }

    const next = new Set(selectedFindingIds);

    for (const id of scopeIds) {
      next.add(id);
    }

    onSelectionChange(next);
  }

  const ariaLabel = buyerPolishedShell
    ? "Review records and dispositions"
    : "Architecture risk register";
  const resourceGroups = groupByResource ? groupGovernanceFindingQueueRows(rows) : [];

  return (
    <div
      className="hidden md:block"
      tabIndex={groupByResource ? undefined : 0}
      role="region"
      aria-label={ariaLabel}
      onKeyDown={groupByResource ? undefined : keyboardNav.onTableKeyDown}
      data-testid="governance-findings-queue-keyboard-region"
    >
      {groupByResource ? (
        <p className={cn("mb-2 text-neutral-500", DESIGN_TOKENS.table.cellSecondary)} aria-hidden="true">
          Findings are grouped by resource or system context. Turn off Group by resource to restore row keyboard navigation.
        </p>
      ) : (
        <p className={cn("mb-2 text-neutral-500", DESIGN_TOKENS.table.cellSecondary)} aria-hidden="true">
          <kbd className={cn("rounded border border-neutral-300 px-1 font-mono dark:border-neutral-600", OPERATOR_TYPOGRAPHY.micro)}>
            j
          </kbd>
          /
          <kbd className={cn("rounded border border-neutral-300 px-1 font-mono dark:border-neutral-600", OPERATOR_TYPOGRAPHY.micro)}>
            k
          </kbd>
          {" move rows · "}
          <kbd className={cn("rounded border border-neutral-300 px-1 font-mono dark:border-neutral-600", OPERATOR_TYPOGRAPHY.micro)}>
            Enter
          </kbd>
          {" open finding"}
        </p>
      )}

      {groupByResource ? (
        <div className="space-y-3" data-testid="governance-findings-resource-groups">
          {resourceGroups.map((group) => {
            const groupAllSelected =
              hasBulkSelect &&
              group.rows.length > 0 &&
              group.rows.every((row) => selectedFindingIds.has(row.findingId));
            const groupSomeSelected = hasBulkSelect && group.rows.some((row) => selectedFindingIds.has(row.findingId));
            const recordLabel = group.rows.length === 1 ? "record" : "records";

            return (
              <CollapsibleSection
                key={group.key}
                title={`${group.label} (${group.rows.length} ${recordLabel})`}
                defaultOpen
                sectionTestId={`governance-findings-resource-group-${group.key}`}
              >
                <EnterpriseTable ariaLabel={`${group.label} findings`}>
                  <GovernanceFindingsQueueTableHead
                    buyerPolishedShell={buyerPolishedShell}
                    hasBulkSelect={hasBulkSelect}
                    allSelected={groupAllSelected}
                    someSelected={groupSomeSelected}
                    onToggleAll={() => { toggleAll(group.rows); }}
                  />
                  <GovernanceFindingsQueueTableBody
                    rows={group.rows}
                    buyerPolishedShell={buyerPolishedShell}
                    hasBulkSelect={hasBulkSelect}
                    selectedFindingIds={selectedFindingIds}
                    onToggleRow={toggleRow}
                  />
                </EnterpriseTable>
              </CollapsibleSection>
            );
          })}
        </div>
      ) : (
        <EnterpriseTable ariaLabel={ariaLabel}>
          <GovernanceFindingsQueueTableHead
            buyerPolishedShell={buyerPolishedShell}
            hasBulkSelect={hasBulkSelect}
            allSelected={allSelected}
            someSelected={someSelected}
            onToggleAll={() => { toggleAll(); }}
          />
          <GovernanceFindingsQueueTableBody
            rows={rows}
            buyerPolishedShell={buyerPolishedShell}
            hasBulkSelect={hasBulkSelect}
            selectedFindingIds={selectedFindingIds}
            onToggleRow={toggleRow}
            isRowFocused={keyboardNav.isRowFocused}
          />
        </EnterpriseTable>
      )}
    </div>
  );
}
