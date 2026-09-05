import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { FindingCausalMiniChain } from "@/components/usability/FindingCausalMiniChain";
import {
  buildFindingCausalMiniChain,
  findingCausalMiniChainFromGovernanceQueueRow,
} from "@/lib/findings/finding-causal-mini-chain";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTableCell,
} from "@/components/ui/enterprise-table";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { findingDerivationFromGovernanceQueueRow } from "@/lib/findings/finding-derivation-sentence";
import { FindingPolicyTraceabilityBadges } from "@/components/findings/FindingPolicyTraceabilityBadges";
import { ItsmLinkedTicketStatusChip } from "@/components/findings/ItsmLinkedTicketStatusChip";
import { buildPolicyTraceabilityLinksFromRuleId } from "@/lib/findings/finding-policy-evidence-citations";
import { governanceQueueStatusTagKind } from "@/components/governance/findings/governance-findings-buyer-labels";
import {
  governanceFindingInspectHref,
  governanceQueueGraphEvidenceHref,
} from "@/components/governance/findings/governance-findings-navigation";
import { governanceQueueDispositionLabel } from "@/lib/architecture/architecture-risk-register-page";
import {
  GOVERNANCE_FINDINGS_QUEUE_SEVERITY_STICKY_CLASS,
  GOVERNANCE_FINDINGS_QUEUE_TITLE_STICKY_CLASS,
} from "@/lib/governance/governance-queue-sticky-identity";

import {
  type GovernanceFindingQueueRow,
} from "./governance-finding-queue-row";

function formatRiskRegisterUtcLabel(utc: string | null | undefined): string {
  const raw = (utc ?? "").trim();

  if (raw.length === 0) {
    return " — ";
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

function resolveGovernanceQueueDueUtc(row: GovernanceFindingQueueRow): string | null {
  const raw = row.revisitDueUtc?.trim() ?? row.waiverExpiresAtUtc?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  const parsed = Date.parse(raw);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}

export function GovernanceFindingsQueueDueCell(props: { readonly row: GovernanceFindingQueueRow }): ReactElement {
  const dueUtc = resolveGovernanceQueueDueUtc(props.row);

  if (dueUtc === null) {
    return <span className="text-al-text-secondary">—</span>;
  }

  return (
    <time dateTime={dueUtc} className="text-al-text-primary">
      {formatRiskRegisterUtcLabel(dueUtc)}
    </time>
  );
}

export function governanceQueueSeverityCell(row: GovernanceFindingQueueRow, buyerPolishedShell: boolean): ReactElement {
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

export type GovernanceFindingsQueueOperationalRowCellsProps = {
  readonly row: GovernanceFindingQueueRow;
  readonly showInsightDensityScore?: boolean;
};

export function GovernanceFindingsQueueOperationalRowCells(props: GovernanceFindingsQueueOperationalRowCellsProps): ReactElement {
  const { row, showInsightDensityScore = false } = props;
  const graphHref = governanceQueueGraphEvidenceHref(row);
  const evidenceChipHref =
    graphHref ??
    (row.evidenceHref !== undefined && row.evidenceHref.trim().length > 0 ? row.evidenceHref : null);
  const findingDerivation = findingDerivationFromGovernanceQueueRow(row);
  const evidenceTraceHref =
    row.recordKind === "finding" ? governanceFindingInspectHref(row.runId, row.findingId) : null;

  return (
    <>
      <EnterpriseTableCell className={cn("font-medium text-al-text-primary", GOVERNANCE_FINDINGS_QUEUE_TITLE_STICKY_CLASS)}>
        <Link
          className={OPERATOR_LINK.inline}
          href={governanceFindingInspectHref(row.runId, row.findingId)}
          prefetch={false}
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
        {showInsightDensityScore &&
        row.recordKind === "finding" &&
        row.insightDensityScore !== null &&
        row.insightDensityScore !== undefined &&
        Number.isFinite(row.insightDensityScore) ? (
          <p
            className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
            data-testid={`governance-row-insight-density-${row.findingId}`}
          >
            Density {Math.trunc(row.insightDensityScore)} — classification follows gate (Decision-grade vs checklist)
          </p>
        ) : null}
        <div
          className={cn(
            "mt-0.5 flex flex-wrap items-center gap-1 font-mono font-normal text-al-text-secondary",
            OPERATOR_TYPOGRAPHY.micro,
          )}
        >
          <span>{row.findingId}</span>
          <CopyIdButton value={row.findingId} aria-label="Copy finding ID" />
        </div>
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
      <EnterpriseTableCell className={GOVERNANCE_FINDINGS_QUEUE_SEVERITY_STICKY_CLASS}>
        {governanceQueueSeverityCell(row, false)}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
        {row.recordKind === "finding" ? row.ownerUserId ?? " — " : " — "}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
        {governanceQueueDispositionLabel(row)}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
        {row.recordKind === "finding" && row.agingDays !== undefined ? `${row.agingDays}d` : " — "}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
        {row.recordKind === "finding" ? formatRiskRegisterUtcLabel(row.waiverExpiresAtUtc) : " — "}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
        {row.recordKind === "finding" ? formatRiskRegisterUtcLabel(row.lastReviewedUtc) : " — "}
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
    </>
  );
}
