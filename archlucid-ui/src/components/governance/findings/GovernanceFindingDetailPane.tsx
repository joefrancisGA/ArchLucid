"use client";

import Link from "next/link";
import { memo, type ReactElement } from "react";

import { CopyGovernanceQueueWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { FindingConfidenceBadge } from "@/components/findings/FindingConfidenceBadge";
import { FindingPolicyTraceabilityBadges } from "@/components/findings/FindingPolicyTraceabilityBadges";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { buildPolicyTraceabilityLinksFromRuleId } from "@/lib/findings/finding-policy-evidence-citations";
import {
  BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { cn } from "@/lib/utils";

import {
  formatGovernanceQueueRecordKind,
  type GovernanceFindingQueueRow,
} from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  governanceFindingManifestRecordHref,
  governanceQueueGraphEvidenceHref,
} from "@/components/governance/findings/governance-findings-navigation";
import {
  governanceQueueStatusTagKind,
} from "@/components/governance/findings/governance-findings-buyer-labels";
import { GovernanceFindingsQueueOperationalActions } from "@/components/governance/findings/governance-findings-queue-operational-actions";

export type GovernanceFindingDetailPaneProps = {
  readonly row: GovernanceFindingQueueRow;
  readonly buyerPolishedShell: boolean;
  readonly variant: "buyer" | "operational";
};

/** Expandable finding metadata and actions for mobile queue rows (TB-563). */
function GovernanceFindingDetailPaneComponent({
  row,
  buyerPolishedShell,
  variant,
}: GovernanceFindingDetailPaneProps): ReactElement {
  const graphHref = governanceQueueGraphEvidenceHref(row);
  const buyerVariant = variant === "buyer";

  if (buyerVariant) {
    return (
      <>
        <div>
          <div className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Recommended action</div>
          <p className="m-0 mt-0.5 text-al-text-secondary">{row.recommended}</p>
        </div>
        {row.recordKind === "finding" ? (
          <details className={cn("rounded-md border border-neutral-200 bg-neutral-50/80 px-2 py-2 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}>
            <summary className={cn("cursor-pointer select-none font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              Severity, confidence, and review
            </summary>
            <p className="m-0 mt-2">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Severity</span> {row.severity}
            </p>
            <p className="m-0 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Confidence</span>
              {row.traceConfidenceLevel === "High" ||
              row.traceConfidenceLevel === "Medium" ||
              row.traceConfidenceLevel === "Low" ? (
                <FindingConfidenceBadge level={row.traceConfidenceLevel} />
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </p>
            <p className="m-0 mt-2">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Review</span>{" "}
              <Link
                className={OPERATOR_LINK.inline}
                href={`/architecture/reviews/${encodeURIComponent(row.runId)}`}
              >
                {row.runLabel}
              </Link>
            </p>
          </details>
        ) : null}
        {row.recordKind === "finding" ? (
          <div className="flex flex-col gap-2">
            <CopyGovernanceQueueWorkItemButton
              runId={row.runId}
              findingId={row.findingId}
              findingTitle={row.title}
              severityLabel={row.severity}
              recommendedAction={row.recommended}
              statusLabel={row.status}
              compact
            />
          </div>
        ) : null}
        {graphHref !== null ? (
          <p className="m-0">
            <Link
              className={OPERATOR_LINK.inline}
              href={graphHref}
            >
              {BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA}
            </Link>
          </p>
        ) : null}
      </>
    );
  }

  return (
    <>
      <div>
        <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
          {buyerPolishedShell ? "Record" : "Record kind"}
        </span>
        <p className="m-0 mt-0.5 text-al-text-secondary">
          {formatGovernanceQueueRecordKind(row.recordKind, buyerPolishedShell)}
        </p>
      </div>
      <div>
        <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Severity</span>
        <div className="mt-0.5">
          {buyerPolishedShell && row.recordKind === "decision" ? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Severity does not apply to recorded decision rows.</span>
            </>
          ) : row.recordKind === "finding" ? (
            <SeverityTag severity={row.severity} />
          ) : (
            <span className="text-al-text-secondary">{row.severity}</span>
          )}
        </div>
      </div>
      {buyerPolishedShell && row.recordKind === "finding" ? (
        <div>
          <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Confidence</span>
          <div className="mt-0.5">
            {row.traceConfidenceLevel === "High" ||
            row.traceConfidenceLevel === "Medium" ||
            row.traceConfidenceLevel === "Low" ? (
              <FindingConfidenceBadge level={row.traceConfidenceLevel} />
            ) : (
              <span className="text-neutral-400 dark:text-neutral-500">—</span>
            )}
          </div>
        </div>
      ) : null}
      {!buyerPolishedShell ? (
        <div>
          <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Category</span>
          {row.recordKind === "finding" && row.policyRuleId ? (
            <div className="mt-0.5">
              <FindingPolicyTraceabilityBadges
                {...buildPolicyTraceabilityLinksFromRuleId(row.policyRuleId, row.category || row.policyRuleId)}
              />
            </div>
          ) : (
            <p className="m-0 mt-0.5 text-al-text-secondary">{row.category}</p>
          )}
        </div>
      ) : null}
      <div>
        <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Status</span>
        <div className="mt-0.5">
          <StatusTag kind={governanceQueueStatusTagKind(row.status)} label={row.status} />
        </div>
        {row.recordKind === "finding" && row.humanReviewStatusLabel ? (
          <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {row.humanReviewStatusLabel}
          </p>
        ) : null}
        {row.recordKind === "finding" && row.itsmLinkedTicketsSummary ? (
          <p className={cn("m-0 mt-0.5 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            ITSM: {row.itsmLinkedTicketsSummary}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <GovernanceFindingsQueueOperationalActions row={row} testIdPrefix={`governance-mobile-${row.findingId}`} />
        {graphHref !== null ? (
          <p className="m-0">
            <Link className={OPERATOR_LINK.inline} href={graphHref}>
              {BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA}
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}

export const GovernanceFindingDetailPane = memo(GovernanceFindingDetailPaneComponent);

export function GovernanceFindingOperationalHeaderMeta(props: {
  readonly row: GovernanceFindingQueueRow;
  readonly buyerPolishedShell: boolean;
}): ReactElement {
  const { row, buyerPolishedShell } = props;

  return (
    <div className={cn("mt-2 grid gap-3 border-t border-neutral-100 pt-2 sm:grid-cols-3 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>
      {!buyerPolishedShell ? (
        <div>
          <div className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{SIGNED_MANIFEST_LABEL}</div>
          <div className="mt-0.5">
            <Link
              className={OPERATOR_LINK.inline}
              href={governanceFindingManifestRecordHref(row.runId, row.manifestId)}
            >
              Open sealed record
            </Link>
          </div>
        </div>
      ) : null}
      <div className={buyerPolishedShell ? "sm:col-span-1" : undefined}>
        <div className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review</div>
        <div className="mt-0.5">
          <Link
            className={OPERATOR_LINK.inline}
            href={`/architecture/reviews/${encodeURIComponent(row.runId)}`}
          >
            {row.runLabel}
          </Link>
        </div>
      </div>
      <div className="sm:col-span-1">
        <div className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Recommended action</div>
        <p className="m-0 mt-0.5 text-al-text-secondary">{row.recommended}</p>
      </div>
    </div>
  );
}
