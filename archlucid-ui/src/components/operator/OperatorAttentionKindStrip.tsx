"use client";

import Link from "next/link";

import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_ATTENTION_KIND_DESTINATIONS,
} from "@/lib/operator/operator-attention-kind-destinations";
import {
  OPERATOR_ATTENTION_KIND_IDS,
  OPERATOR_ATTENTION_KIND_LABELS,
  type OperatorAttentionKindId,
} from "@/lib/operator/operator-attention-taxonomy";
import { cn } from "@/lib/utils";

export type OperatorAttentionKindStripProps = {
  readonly variant?: "default" | "compact";
  readonly className?: string;
};

export const OPERATOR_ATTENTION_KIND_STRIP_HELPER =
  "Needs-you queues — open a kind to see what needs action:" as const;

export const OPERATOR_ATTENTION_KIND_STRIP_COMPACT_HELPER =
  "Four attention kinds with live counts — tap to open the matching queue." as const;

/** TB-2353 / TB-2369 — actionable four-kind attention taxonomy for hub pages. */
export function OperatorAttentionKindStrip(
  props: OperatorAttentionKindStripProps,
): React.JSX.Element {
  const variant = props.variant ?? "default";
  const { summaries } = useOperatorAttentionSummary();
  const summaryByPartition = new Map(summaries.map((summary) => [summary.partition, summary]));

  return (
    <div
      className={cn("space-y-2", props.className)}
      data-testid="operator-attention-kind-strip"
      data-variant={variant}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {variant === "compact"
          ? OPERATOR_ATTENTION_KIND_STRIP_COMPACT_HELPER
          : OPERATOR_ATTENTION_KIND_STRIP_HELPER}
      </p>
      <ul
        className="m-0 flex list-none flex-wrap gap-2 p-0"
        data-testid="operator-attention-kind-chips"
      >
        {OPERATOR_ATTENTION_KIND_IDS.map((kind: OperatorAttentionKindId) => {
          const destination = OPERATOR_ATTENTION_KIND_DESTINATIONS[kind];
          const count = summaryByPartition.get(kind)?.totalCount ?? 0;

          return (
            <li key={kind}>
              <Link
                href={destination.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 no-underline transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-neutral-600 dark:hover:bg-neutral-900",
                  OPERATOR_LINK,
                  OPERATOR_TYPOGRAPHY.helper,
                )}
                data-testid={`operator-attention-kind-chip-${kind}`}
              >
                <span className="font-medium text-al-text-primary">
                  {OPERATOR_ATTENTION_KIND_LABELS[kind]}
                </span>
                <span
                  className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  aria-label={`${count} items`}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
