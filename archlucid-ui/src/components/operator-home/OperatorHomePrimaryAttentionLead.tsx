"use client";

import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { OPERATOR_ATTENTION_KIND_DESTINATIONS } from "@/lib/operator/operator-attention-kind-destinations";
import { resolveHighestNonZeroAttentionKind } from "@/lib/operator/operator-attention-chip-needs-action";
import {
  OPERATOR_ATTENTION_KIND_IDS,
  OPERATOR_ATTENTION_KIND_LABELS,
} from "@/lib/operator/operator-attention-taxonomy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Prominent lead for the highest non-zero attention partition (P0 — awaiting approval first). */
export function OperatorHomePrimaryAttentionLead(): React.JSX.Element | null {
  const { summaries } = useOperatorAttentionSummary();
  const summaryByPartition = new Map(summaries.map((summary) => [summary.partition, summary]));
  const countsByKind = Object.fromEntries(
    OPERATOR_ATTENTION_KIND_IDS.map((kind) => [kind, summaryByPartition.get(kind)?.totalCount ?? 0]),
  ) as Partial<Record<(typeof OPERATOR_ATTENTION_KIND_IDS)[number], number>>;
  const leadKind = resolveHighestNonZeroAttentionKind(countsByKind, OPERATOR_ATTENTION_KIND_IDS);

  if (leadKind === null) {
    return null;
  }

  const count = countsByKind[leadKind] ?? 0;

  if (count === 0) {
    return null;
  }

  const destination = OPERATOR_ATTENTION_KIND_DESTINATIONS[leadKind];
  const label = OPERATOR_ATTENTION_KIND_LABELS[leadKind];
  const bodyCopy = destination.description;

  return (
    <div
      className="rounded-md border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="operator-home-primary-attention-lead"
      data-attention-kind={leadKind}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag kind="needs-attention" label={label} />
            <span className={cn("font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.kpiValue)}>
              {count}
            </span>
          </div>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{bodyCopy}</p>
        </div>
        <Link
          href={destination.href}
          className={cn("shrink-0 font-semibold", OPERATOR_LINK.nav)}
          data-testid={`operator-home-primary-attention-lead-link-${leadKind}`}
        >
          {destination.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
