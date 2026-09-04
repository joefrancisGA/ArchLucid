"use client";

import { FilterChip } from "@/components/ui/filter-chip";
import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_ATTENTION_KIND_DESTINATIONS,
} from "@/lib/operator/operator-attention-kind-destinations";
import { isOperatorAttentionKindDestinationActive } from "@/lib/operator/operator-attention-kind-chip-selected";
import {
  OPERATOR_ATTENTION_KIND_IDS,
  OPERATOR_ATTENTION_KIND_LABELS,
  type OperatorAttentionKindId,
} from "@/lib/operator/operator-attention-taxonomy";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

export type OperatorAttentionKindStripProps = {
  readonly variant?: "default" | "compact";
  readonly className?: string;
  /** Kinds already surfaced on the same page — omit chips to avoid duplicate counts. */
  readonly suppressKinds?: readonly OperatorAttentionKindId[];
};

export const OPERATOR_ATTENTION_KIND_STRIP_HELPER =
  "Needs-you queues — open a kind to see what needs action:" as const;

/** TB-2353 / TB-2369 — actionable four-kind attention taxonomy for hub pages. */
export function OperatorAttentionKindStrip(
  props: OperatorAttentionKindStripProps,
): React.JSX.Element {
  const variant = props.variant ?? "default";
  const suppressKinds = new Set(props.suppressKinds ?? []);
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { summaries } = useOperatorAttentionSummary();
  const summaryByPartition = new Map(summaries.map((summary) => [summary.partition, summary]));
  const visibleKinds = OPERATOR_ATTENTION_KIND_IDS.filter((kind) => !suppressKinds.has(kind));

  return (
    <div
      className={cn("space-y-2", props.className)}
      data-testid="operator-attention-kind-strip"
      data-variant={variant}
    >
      {variant === "default" || variant === "compact" ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {OPERATOR_ATTENTION_KIND_STRIP_HELPER}
        </p>
      ) : null}
      <ul
        className="m-0 flex list-none flex-wrap gap-1.5 p-0"
        data-testid="operator-attention-kind-chips"
      >
        {visibleKinds.map((kind: OperatorAttentionKindId) => {
          const destination = OPERATOR_ATTENTION_KIND_DESTINATIONS[kind];
          const count = summaryByPartition.get(kind)?.totalCount ?? 0;
          const label = OPERATOR_ATTENTION_KIND_LABELS[kind];
          const selected = isOperatorAttentionKindDestinationActive(
            pathname,
            searchParams,
            destination.href,
          );

          const needsAction = kind === "awaiting-approval" && count > 0 && !selected;

          return (
            <li key={kind}>
              <FilterChip
                href={destination.href}
                className={cn("gap-1", buyerFilterChipClass(selected, false, count === 0, needsAction))}
                aria-current={selected ? "page" : undefined}
                aria-label={`${label}: ${count} items`}
                data-testid={`operator-attention-kind-chip-${kind}`}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    count > 0 ? "text-al-text-primary" : "text-al-text-secondary",
                  )}
                  aria-hidden="true"
                >
                  ({count})
                </span>
              </FilterChip>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
