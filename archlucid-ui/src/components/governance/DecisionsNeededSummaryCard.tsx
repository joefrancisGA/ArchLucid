"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { Card, CardContent } from "@/components/ui/card";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import type { GovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { findingsPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";
import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";

export type DecisionsNeededTile = {
  key: string;
  label: string;
  count: number;
  href: string;
  cautionAccent?: boolean;
};

export function buildDecisionsNeededTiles(
  summary: GovernanceDecisionsNeededSummary,
  productLine: ProductLineId = "architecture",
): DecisionsNeededTile[] {
  const findingsBase = findingsPathForProductLine(productLine);

  return [
    {
      key: "pendingApprovals",
      label: "Pending approvals",
      count: summary.pendingApprovals,
      href: "/governance/approval-queue",
    },
    {
      key: "staleRisks",
      label: "Stale risks",
      count: summary.staleRisks,
      href: buildGovernanceFindingsQueueHref({ filter: "stale", basePath: findingsBase }),
    },
    {
      key: "unownedHighSeverityRisks",
      label: "Unowned High risks",
      count: summary.unownedHighSeverityRisks,
      href: findingsBase,
    },
    {
      key: "findingsAwaitingEvidence",
      label: "Awaiting evidence",
      count: summary.findingsAwaitingEvidence,
      href: findingsBase,
    },
    {
      key: "waiversExpiringWithin14Days",
      label: "Waivers expiring (14d)",
      count: summary.waiversExpiringWithin14Days,
      href: "/governance/exceptions",
      cautionAccent: summary.waiversExpiringWithin14Days > 0,
    },
    {
      key: "deferredFindingsDue",
      label: "Deferred items due",
      count: summary.deferredFindingsDue,
      href: findingsBase,
    },
  ];
}

export type DecisionsNeededSummaryCardProps = {
  summary: GovernanceDecisionsNeededSummary;
};

/** Six-tile KPI strip for approval decisions-needed summary (TB-223). */
export function DecisionsNeededSummaryCard(props: DecisionsNeededSummaryCardProps) {
  const { summary } = props;
  const { productLine } = useProductLine();
  const tiles = buildDecisionsNeededTiles(summary, productLine);

  if (summary.totalDecisionItems === 0) {
    return (
      <section data-testid="decisions-needed-summary-card">
        <OperatorEmptyState title="No decisions needed — all risks are current." />
      </section>
    );
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-800" data-testid="decisions-needed-summary-card">
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Decisions needed</h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>
            Open approval actions in the current workspace scope — refreshed every 30 seconds.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.key}
              href={tile.href}
              className={cn(
                "rounded-md border border-neutral-200 bg-al-surface-base px-3 py-3 no-underline transition-colors hover:bg-[var(--al-layer-hover)] dark:border-neutral-800",
                tile.cautionAccent === true
                  ? "border-l-4 border-l-[var(--al-status-warn-fg)]"
                  : "",
              )}
              data-testid={`decisions-needed-tile-${tile.key}`}
            >
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>{tile.label}</p>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.kpiValue)}>{tile.count}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
