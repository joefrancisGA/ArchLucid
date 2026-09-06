"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, type ReactElement } from "react";

import { FindingDispositionRecordCorrectionControl } from "@/components/governance/findings/FindingDispositionRecordCorrectionControl";
import { FindingListDispositionRowActions } from "@/components/governance/findings/FindingListDispositionRowActions";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { FindingCausalMiniChain } from "@/components/usability/FindingCausalMiniChain";
import {
  buildFindingCausalMiniChain,
  findingCausalMiniChainFromGovernanceQueueRow,
} from "@/lib/findings/finding-causal-mini-chain";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { FindingPolicyTraceabilityBadges } from "@/components/findings/FindingPolicyTraceabilityBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { buildPolicyTraceabilityLinksFromRuleId } from "@/lib/findings/finding-policy-evidence-citations";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { findingDerivationFromGovernanceQueueRow } from "@/lib/findings/finding-derivation-sentence";
import { cn } from "@/lib/utils";

import {
  type GovernanceFindingQueueRow,
} from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  governanceBuyerRecordTypePrimary,
  governanceBuyerRecordTypeSecondary,
  governanceQueueStatusTagKind,
} from "@/components/governance/findings/governance-findings-buyer-labels";
import {
  GovernanceFindingDetailPane,
  GovernanceFindingOperationalHeaderMeta,
} from "@/components/governance/findings/GovernanceFindingDetailPane";
import {
  governanceFindingDetailKeyboardActivate,
  governanceFindingInspectHref,
  navigateGovernanceFindingDetail,
} from "@/components/governance/findings/governance-findings-navigation";
import { ItsmLinkedTicketStatusChip } from "@/components/findings/ItsmLinkedTicketStatusChip";

export type GovernanceFindingRowProps = {
  readonly row: GovernanceFindingQueueRow;
  readonly buyerPolishedShell: boolean;
  readonly variant: "buyer" | "operational";
  readonly showNewSinceLastVisit?: boolean;
  readonly onOpenRow?: () => void;
  readonly onOpenFinding?: (row: GovernanceFindingQueueRow) => void;
};

function GovernanceFindingRowComponent({
  row,
  buyerPolishedShell,
  variant,
  showNewSinceLastVisit = false,
  onOpenRow,
  onOpenFinding,
}: GovernanceFindingRowProps): ReactElement {
  const router = useRouter();
  const rowIsDecision = row.recordKind === "decision";
  const buyerVariant = variant === "buyer";
  const findingDerivation = findingDerivationFromGovernanceQueueRow(row);
  const evidenceTraceHref =
    row.recordKind === "finding" ? governanceFindingInspectHref(row.runId, row.findingId) : null;

  if (buyerVariant) {
    return (
      <Card
        className={
          rowIsDecision
            ? "cursor-pointer border border-neutral-200 shadow-sm transition-colors hover:border-neutral-300 hover:bg-[var(--al-layer-hover)] dark:hover:border-neutral-700 dark:hover:bg-neutral-800/80"
            : "border border-neutral-200 shadow-sm dark:border-neutral-800"
        }
        onClick={
          rowIsDecision
            ? () => {
                onOpenRow?.();
                navigateGovernanceFindingDetail(router, row.runId, row.findingId);
              }
            : undefined
        }
        onKeyDown={
          rowIsDecision
            ? (event) => {
                governanceFindingDetailKeyboardActivate(event, router, row.runId, row.findingId);
                onOpenRow?.();
              }
            : undefined
        }
        tabIndex={0}
        role={rowIsDecision ? "button" : "article"}
        aria-label={rowIsDecision ? `Open decision: ${row.title}` : `Finding: ${row.title}`}
        data-finding-id={row.recordKind === "finding" ? row.findingId : undefined}
      >
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}>
            {showNewSinceLastVisit ? (
              <span className="mr-2 inline-flex align-middle">
                <NewSinceLastVisitMarker testId={`governance-row-new-${row.findingId}`} />
              </span>
            ) : null}
            <Link
              className={OPERATOR_LINK.inline}
              href={governanceFindingInspectHref(row.runId, row.findingId)}
              onClick={(event) => {
                if (row.recordKind === "finding" && onOpenFinding !== undefined) {
                  event.preventDefault();
                  onOpenFinding(row);
                  onOpenRow?.();
                  return;
                }

                onOpenRow?.();
              }}
            >
              {row.title}
            </Link>
          </CardTitle>
          {row.recordKind === "finding" && row.policyRuleId ? (
            <FindingPolicyTraceabilityBadges
              className="mt-1"
              {...buildPolicyTraceabilityLinksFromRuleId(row.policyRuleId, row.category || row.policyRuleId)}
            />
          ) : null}
          {findingDerivation !== null ? (
            <div className="mt-2">
              <FindingDerivationLine
                derivation={findingDerivation}
                evidenceHref={evidenceTraceHref}
                testId={`governance-finding-derivation-${row.findingId}`}
              />
              <FindingCausalMiniChain
                chain={findingCausalMiniChainFromGovernanceQueueRow(row) ?? buildFindingCausalMiniChain({})}
                className="mt-2"
              />
            </div>
          ) : null}
        </CardHeader>
        <CardContent className={cn("grid gap-3 pt-0", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <div className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Record type</div>
            <p className="m-0 mt-0.5 text-al-text-secondary">
              {governanceBuyerRecordTypePrimary(row)}
              {governanceBuyerRecordTypeSecondary(row) !== null ? (
                <>
                  <br />
                  <span className="text-neutral-700 dark:text-neutral-300">{governanceBuyerRecordTypeSecondary(row)}</span>
                </>
              ) : null}
            </p>
          </div>
          <div>
            <div className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Status</div>
            <div className="mt-0.5">
              <StatusTag kind={governanceQueueStatusTagKind(row.status)} label={row.status} />
            </div>
            {row.recordKind === "finding" && row.humanReviewStatusLabel ? (
              <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.humanReviewStatusLabel}</p>
            ) : null}
            {row.recordKind === "finding" && row.itsmLinkedTicketsSummary ? (
              <div className="mt-1">
                <ItsmLinkedTicketStatusChip summary={row.itsmLinkedTicketsSummary} />
              </div>
            ) : null}
          </div>
          <GovernanceFindingDetailPane row={row} buyerPolishedShell={buyerPolishedShell} variant="buyer" />
          {row.recordKind === "finding" ? (
            <FindingListDispositionRowActions findingId={row.findingId} compact />
          ) : null}
          {row.recordKind === "finding"
          && row.latestDisposition !== null
          && row.latestDisposition !== undefined
          && row.latestDisposition.trim().length > 0 ? (
            <FindingDispositionRecordCorrectionControl
              findingId={row.findingId}
              runId={row.runId}
              hasRecordedDisposition={true}
              testId={`governance-row-record-correction-${row.findingId}`}
            />
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border border-neutral-200 shadow-sm dark:border-neutral-800"
      role="article"
      tabIndex={0}
      data-finding-id={row.recordKind === "finding" ? row.findingId : undefined}
      aria-label={`Finding: ${row.title}`}
    >
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}>
          <Link
            className={OPERATOR_LINK.inline}
            href={governanceFindingInspectHref(row.runId, row.findingId)}
          >
            {row.title}
          </Link>
        </CardTitle>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {buyerPolishedShell ? (
            row.runLabel
          ) : (
            <span className="inline-flex flex-wrap items-center gap-1">
              <span>{`${row.runLabel} · ${row.findingId}`}</span>
              <CopyIdButton value={row.findingId} aria-label="Copy finding ID" />
            </span>
          )}
        </p>
        {findingDerivation !== null ? (
          <>
          <FindingDerivationLine
            derivation={findingDerivation}
            evidenceHref={evidenceTraceHref}
            testId={`governance-finding-derivation-${row.findingId}`}
            compact
          />
            <FindingCausalMiniChain
              chain={findingCausalMiniChainFromGovernanceQueueRow(row) ?? buildFindingCausalMiniChain({})}
              className="mt-2"
            />
          </>
        ) : null}
        <GovernanceFindingOperationalHeaderMeta row={row} buyerPolishedShell={buyerPolishedShell} />
      </CardHeader>
      <CardContent className={cn("grid gap-2 pt-0 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <GovernanceFindingDetailPane row={row} buyerPolishedShell={buyerPolishedShell} variant="operational" />
        {row.recordKind === "finding" ? (
          <FindingListDispositionRowActions findingId={row.findingId} compact />
        ) : null}
        {row.recordKind === "finding"
        && row.latestDisposition !== null
        && row.latestDisposition !== undefined
        && row.latestDisposition.trim().length > 0 ? (
          <FindingDispositionRecordCorrectionControl
            findingId={row.findingId}
            runId={row.runId}
            hasRecordedDisposition={true}
            testId={`governance-row-record-correction-${row.findingId}`}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

export const GovernanceFindingRow = memo(GovernanceFindingRowComponent);
