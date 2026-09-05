"use client";

import Link from "next/link";

import { AttentionLinkChip } from "@/components/operator/AttentionLinkChip";
import { StatusTag } from "@/components/ui/status-tag";
import { useAttentionPartitionPreviews } from "@/hooks/use-attention-partition-previews";
import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  OPERATOR_ATTENTION_KIND_DESTINATIONS,
} from "@/lib/operator/operator-attention-kind-destinations";
import { isOperatorAttentionKindDestinationActive } from "@/lib/operator/operator-attention-kind-chip-selected";
import {
  formatOperatorAttentionChipAriaLabel,
  operatorAttentionChipNeedsAction,
  resolveHighestNonZeroAttentionKind,
} from "@/lib/operator/operator-attention-chip-needs-action";
import {
  OPERATOR_ATTENTION_KIND_IDS,
  OPERATOR_ATTENTION_KIND_LABELS,
  type OperatorAttentionKindId,
} from "@/lib/operator/operator-attention-taxonomy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

export type OperatorAttentionKindStripProps = {
  readonly variant?: "default" | "compact";
  readonly className?: string;
  /** Kinds already surfaced on the same page — omit chips to avoid duplicate counts. */
  readonly suppressKinds?: readonly OperatorAttentionKindId[];
};

/** TB-2353 / TB-2369 — actionable four-kind attention taxonomy for hub pages. */
export function OperatorAttentionKindStrip(
  props: OperatorAttentionKindStripProps,
): React.JSX.Element {
  const variant = props.variant ?? "default";
  const suppressKinds = new Set(props.suppressKinds ?? []);
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { summaries } = useOperatorAttentionSummary();
  const partitionPreviews = useAttentionPartitionPreviews();
  const summaryByPartition = new Map(summaries.map((summary) => [summary.partition, summary]));
  const visibleKinds = OPERATOR_ATTENTION_KIND_IDS.filter((kind) => !suppressKinds.has(kind));
  const countsByKind = Object.fromEntries(
    visibleKinds.map((kind) => [kind, summaryByPartition.get(kind)?.totalCount ?? 0]),
  ) as Partial<Record<OperatorAttentionKindId, number>>;
  const previewKind = resolveHighestNonZeroAttentionKind(countsByKind, visibleKinds);
  const previewLine = previewKind !== null ? partitionPreviews[previewKind] : null;

  return (
    <div
      className={props.className}
      data-testid="operator-attention-kind-strip"
      data-variant={variant}
    >
      <ul
        className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0"
        data-testid="operator-attention-kind-chips"
      >
        {visibleKinds.map((kind: OperatorAttentionKindId) => {
          const destination = OPERATOR_ATTENTION_KIND_DESTINATIONS[kind];
          const count = countsByKind[kind] ?? 0;
          const label = OPERATOR_ATTENTION_KIND_LABELS[kind];
          const selected = isOperatorAttentionKindDestinationActive(
            pathname,
            searchParams,
            destination.href,
          );
          const needsAction = operatorAttentionChipNeedsAction(count);
          const deEmphasized = count === 0;

          return (
            <li key={kind} className="flex items-center">
              {needsAction ? (
                <Link
                  href={destination.href}
                  className={cn(
                    "inline-flex w-fit shrink-0 max-w-full items-center gap-2 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 shadow-sm hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800",
                    selected ? "ring-2 ring-teal-600 ring-offset-2 dark:ring-teal-400" : undefined,
                  )}
                  aria-current={selected ? "page" : undefined}
                  aria-label={formatOperatorAttentionChipAriaLabel(label, count)}
                  data-testid={`operator-attention-kind-chip-${kind}`}
                >
                  <StatusTag kind="needs-attention" label={label} />
                  <span className={cn("font-mono text-lg font-semibold tabular-nums text-al-text-primary")}>
                    {count}
                  </span>
                </Link>
              ) : (
                <AttentionLinkChip
                  href={destination.href}
                  className={buyerFilterChipClass(selected, false, deEmphasized, false)}
                  aria-current={selected ? "page" : undefined}
                  aria-label={formatOperatorAttentionChipAriaLabel(label, count)}
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
                </AttentionLinkChip>
              )}
            </li>
          );
        })}
      </ul>
      {previewLine !== null && previewKind !== null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`operator-attention-partition-preview-${previewKind}`}
        >
          <span className="font-medium text-al-text-primary">{OPERATOR_ATTENTION_KIND_LABELS[previewKind]}:</span>{" "}
          {previewLine}
        </p>
      ) : null}
    </div>
  );
}
