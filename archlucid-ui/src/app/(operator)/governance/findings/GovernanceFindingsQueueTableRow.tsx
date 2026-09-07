"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { CSSProperties, ReactElement } from "react";

import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { FindingCausalMiniChain } from "@/components/usability/FindingCausalMiniChain";
import {
  buildFindingCausalMiniChain,
  findingCausalMiniChainFromGovernanceQueueRow,
} from "@/lib/findings/finding-causal-mini-chain";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { FindingConfidenceBadge } from "@/components/findings/FindingConfidenceBadge";
import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTableCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA } from "@/lib/buyer/buyer-polish-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { findingDerivationFromGovernanceQueueRow } from "@/lib/findings/finding-derivation-sentence";
import { CopyGovernanceQueueWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { FindingPolicyTraceabilityBadges } from "@/components/findings/FindingPolicyTraceabilityBadges";
import { buildPolicyTraceabilityLinksFromRuleId } from "@/lib/findings/finding-policy-evidence-citations";
import { governanceQueueStatusTagKind } from "@/components/governance/findings/governance-findings-buyer-labels";
import { GovernanceFindingsQueueOperationalActions } from "@/components/governance/findings/governance-findings-queue-operational-actions";
import { ItsmLinkedTicketStatusChip } from "@/components/findings/ItsmLinkedTicketStatusChip";
import {
  governanceFindingInspectHref,
  governanceQueueGraphEvidenceHref,
} from "@/components/governance/findings/governance-findings-navigation";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";

import {
  formatGovernanceQueueRecordKind,
  type GovernanceFindingQueueRow,
} from "./governance-finding-queue-row";
import { GovernanceFindingsQueueAssignedToMeRowCells } from "./GovernanceFindingsQueueAssignedToMeRowCells";
import {
  governanceQueueSeverityCell,
  GovernanceFindingsQueueOperationalRowCells,
} from "./GovernanceFindingsQueueOperationalRowCells";

export type GovernanceFindingsQueueTableRowProps = {
  readonly row: GovernanceFindingQueueRow;
  readonly buyerPolishedShell: boolean;
  readonly queueMode?: GovernanceFindingsQueueMode;
  readonly hasBulkSelect: boolean;
  readonly selectedFindingIds?: ReadonlySet<string>;
  readonly onToggleRow?: (findingId: string) => void;
  readonly isFocused?: boolean;
  readonly style?: CSSProperties;
  readonly showNewSinceLastVisit?: boolean;
  readonly showInsightDensityScore?: boolean;
  readonly onOpenRow?: () => void;
};

/** Single policy findings queue row (flat list; supports virtualization). */
export function GovernanceFindingsQueueTableRow(props: GovernanceFindingsQueueTableRowProps): ReactElement {
  const {
    row,
    buyerPolishedShell,
    queueMode = "tenant",
    hasBulkSelect,
    selectedFindingIds,
    onToggleRow,
    isFocused,
    style,
    showNewSinceLastVisit = false,
    showInsightDensityScore = false,
    onOpenRow,
  } = props;
  const graphHref = governanceQueueGraphEvidenceHref(row);
  const evidenceChipHref =
    graphHref ??
    (row.evidenceHref !== undefined && row.evidenceHref.trim().length > 0 ? row.evidenceHref : null);
  const findingDerivation = findingDerivationFromGovernanceQueueRow(row);
  const evidenceTraceHref =
    row.recordKind === "finding" ? governanceFindingInspectHref(row.runId, row.findingId) : null;

  return (
    <EnterpriseTableRow
      style={style}
      className={isFocused ? "ring-2 ring-inset ring-neutral-500/40 dark:ring-neutral-400/40" : undefined}
      tabIndex={row.recordKind === "finding" ? 0 : undefined}
      data-finding-id={row.recordKind === "finding" ? row.findingId : undefined}
      aria-label={row.recordKind === "finding" ? `Finding: ${row.title}` : undefined}
    >
      {hasBulkSelect ? (
        <EnterpriseTableCell className="w-8">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-teal-700 dark:border-neutral-600"
            aria-label={`Select finding: ${row.title}`}
            checked={selectedFindingIds?.has(row.findingId) ?? false}
            onChange={() => {
              onToggleRow?.(row.findingId);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          />
        </EnterpriseTableCell>
      ) : null}
      {buyerPolishedShell ? (
        <>
          <EnterpriseTableCell>{governanceQueueSeverityCell(row, buyerPolishedShell)}</EnterpriseTableCell>
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
          <EnterpriseTableCell className="text-al-text-primary">
            {formatGovernanceQueueRecordKind(row.recordKind, buyerPolishedShell)}
          </EnterpriseTableCell>
          <EnterpriseTableCell className="font-medium text-al-text-primary">
            {showNewSinceLastVisit ? (
              <span className="mr-2 inline-flex align-middle">
                <NewSinceLastVisitMarker testId={`governance-table-row-new-${row.findingId}`} />
              </span>
            ) : null}
            <Link
              className={OPERATOR_LINK.inline}
              href={governanceFindingInspectHref(row.runId, row.findingId)}
              prefetch={false}
              onClick={() => {
                onOpenRow?.();
              }}
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
            {findingDerivation !== null ? (
              <div className="mt-1">
                <FindingDerivationLine
                  derivation={findingDerivation}
                  evidenceHref={evidenceTraceHref ?? evidenceChipHref}
                  testId={`governance-table-derivation-${row.findingId}`}
                  compact
                />
              <FindingCausalMiniChain
                chain={findingCausalMiniChainFromGovernanceQueueRow(row) ?? buildFindingCausalMiniChain({})}
                className="mt-2"
              />
              </div>
            ) : null}
            {evidenceChipHref !== null ? (
              <div className="mt-1">
                <FindingEvidenceLinkChip href={evidenceChipHref} evidenceRefCount={row.evidenceRefCount} />
              </div>
            ) : null}
          </EnterpriseTableCell>
          <EnterpriseTableCell>
            <Link className={OPERATOR_LINK.inline} href={`/architecture/reviews/${encodeURIComponent(row.runId)}`}>
              {row.runLabel}
            </Link>
          </EnterpriseTableCell>
          <EnterpriseTableCell>
            <StatusTag kind={governanceQueueStatusTagKind(row.status)} label={row.status} />
            {row.recordKind === "finding" && row.humanReviewStatusLabel ? (
              <div className={cn("mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                {row.humanReviewStatusLabel}
              </div>
            ) : null}
        {row.recordKind === "finding" && row.itsmLinkedTicketsSummary ? (
          <div className="mt-0.5">
            <ItsmLinkedTicketStatusChip summary={row.itsmLinkedTicketsSummary} />
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
          <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>{row.recommended}</EnterpriseTableCell>
        </>
      ) : queueMode === "assigned-to-me" ? (
        <GovernanceFindingsQueueAssignedToMeRowCells
          row={row}
          showNewSinceLastVisit={showNewSinceLastVisit}
          onOpenRow={onOpenRow}
        />
      ) : (
        <GovernanceFindingsQueueOperationalRowCells row={row} showInsightDensityScore={showInsightDensityScore} />
      )}
      <EnterpriseTableCell>
        {buyerPolishedShell ? (
          <div className="flex flex-col gap-2">
            <Button asChild variant="primary" size="sm" className="h-8">
              <Link
                href={governanceFindingInspectHref(row.runId, row.findingId)}
                prefetch={false}
                onClick={() => {
                  onOpenRow?.();
                }}
              >
                {row.recordKind === "decision" ? "View decision" : BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA}
              </Link>
            </Button>
            {row.recordKind === "finding" ? (
              <CopyGovernanceQueueWorkItemButton
                runId={row.runId}
                findingId={row.findingId}
                findingTitle={row.title}
                severityLabel={row.severity}
                recommendedAction={row.recommended}
                statusLabel={row.status}
                compact
              />
            ) : null}
          </div>
        ) : (
          <GovernanceFindingsQueueOperationalActions row={row} queueMode={queueMode} />
        )}
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}
