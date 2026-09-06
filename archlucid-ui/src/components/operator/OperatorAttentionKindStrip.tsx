"use client";

import { OperatorAttentionKindChip } from "@/components/operator/OperatorAttentionKindChip";
import { useAttentionPartitionPreviews } from "@/hooks/use-attention-partition-previews";
import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import {
  OPERATOR_ATTENTION_KIND_DESTINATIONS,
} from "@/lib/operator/operator-attention-kind-destinations";
import { isOperatorAttentionKindDestinationActive } from "@/lib/operator/operator-attention-kind-chip-selected";
import { resolveHighestNonZeroAttentionKind } from "@/lib/operator/operator-attention-chip-needs-action";
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
  const visibleKinds = OPERATOR_ATTENTION_KIND_IDS.filter((kind) => {
    if (suppressKinds.has(kind)) {
      return false;
    }

    const count = summaryByPartition.get(kind)?.totalCount ?? 0;

    return count > 0;
  });
  const countsByKind = Object.fromEntries(
    visibleKinds.map((kind) => [kind, summaryByPartition.get(kind)?.totalCount ?? 0]),
  ) as Partial<Record<OperatorAttentionKindId, number>>;
  const previewKind = resolveHighestNonZeroAttentionKind(countsByKind, visibleKinds);
  const previewLine = previewKind !== null ? partitionPreviews[previewKind] : null;

  if (visibleKinds.length === 0) {
    return null;
  }

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
          const selected = isOperatorAttentionKindDestinationActive(
            pathname,
            searchParams,
            destination.href,
          );

          return (
            <li key={kind} className="flex items-center">
              <OperatorAttentionKindChip
                kind={kind}
                href={destination.href}
                count={count}
                selected={selected}
              />
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
