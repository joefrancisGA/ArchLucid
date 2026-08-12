"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { CopyGovernanceQueueWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";
import { Button } from "@/components/ui/button";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { governanceFindingInspectHref } from "@/components/governance/findings/governance-findings-navigation";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture/architecture-intelligence-run-href";
import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";

export type GovernanceQueueRiskExceptionAction = {
  readonly href: string;
  readonly label: string;
};

/** Risk-exception CTA — inspect to create, register to view an existing waiver. */
export function resolveGovernanceQueueRiskExceptionAction(
  row: GovernanceFindingQueueRow,
): GovernanceQueueRiskExceptionAction {
  if ((row.waiverExpiresAtUtc?.trim() ?? "").length > 0) {
    return { href: GOVERNANCE_EXCEPTIONS_PATH, label: "View exception" };
  }

  return {
    href: governanceFindingInspectHref(row.runId, row.findingId),
    label: "Create exception",
  };
}

export type GovernanceFindingsQueueOperationalActionsProps = {
  readonly row: GovernanceFindingQueueRow;
  readonly testIdPrefix?: string;
};

/** Primary operational actions shared by the desktop table and mobile queue cards. */
export function GovernanceFindingsQueueOperationalActions(
  props: GovernanceFindingsQueueOperationalActionsProps,
): ReactElement {
  const { row, testIdPrefix } = props;
  const riskException = resolveGovernanceQueueRiskExceptionAction(row);

  return (
    <div
      className="flex flex-col gap-2"
      data-testid={testIdPrefix !== undefined ? `${testIdPrefix}-actions` : "governance-findings-queue-row-actions"}
    >
      <Button asChild variant="primary" size="sm" className="h-8">
        <Link href={governanceFindingInspectHref(row.runId, row.findingId)}>View risk</Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="h-8">
        <Link href={`/architecture/reviews/${encodeURIComponent(row.runId)}`}>Open source review</Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="h-8">
        <Link
          href={buildArchitectureIntelligenceRunHref({ runId: row.runId, from: "findings" })}
          data-testid={
            testIdPrefix !== undefined
              ? `${testIdPrefix}-architecture-intelligence`
              : "governance-findings-architecture-intelligence"
          }
        >
          Architecture intelligence
        </Link>
      </Button>
      {row.recordKind === "finding" ? (
        <>
          <Button asChild variant="outline" size="sm" className="h-8">
            <Link href={riskException.href}>{riskException.label}</Link>
          </Button>
          <CopyGovernanceQueueWorkItemButton
            runId={row.runId}
            findingId={row.findingId}
            findingTitle={row.title}
            severityLabel={row.severity}
            recommendedAction={row.recommended}
            statusLabel={row.status}
            compact
          />
          <ItsmOutboundQuickActions findingId={row.findingId} compact />
        </>
      ) : null}
    </div>
  );
}
