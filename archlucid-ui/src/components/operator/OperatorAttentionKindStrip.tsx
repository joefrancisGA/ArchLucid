import { cn } from "@/lib/utils";

import {
  OPERATOR_ATTENTION_KIND_IDS,
  OPERATOR_ATTENTION_KIND_LABELS,
  type OperatorAttentionKindId,
} from "@/lib/operator/operator-attention-taxonomy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type OperatorAttentionKindStripProps = {
  readonly variant?: "default" | "compact";
  readonly className?: string;
};

export const OPERATOR_ATTENTION_KIND_STRIP_HELPER =
  "Needs-you queues use four kinds — each inbox maps to one kind:" as const;

export const OPERATOR_ATTENTION_KIND_STRIP_COMPACT_HELPER =
  "Four attention kinds — Unfinished work, Assigned to me, Alerts, Awaiting approval." as const;

function formatAttentionKindList(): string {
  return OPERATOR_ATTENTION_KIND_IDS.map((kind: OperatorAttentionKindId) =>
    OPERATOR_ATTENTION_KIND_LABELS[kind],
  ).join(", ");
}

/** TB-2353 / TB-2369 — compact four-kind attention taxonomy for hub pages. */
export function OperatorAttentionKindStrip(
  props: OperatorAttentionKindStripProps,
): React.JSX.Element {
  const variant = props.variant ?? "default";
  const helper =
    variant === "compact"
      ? OPERATOR_ATTENTION_KIND_STRIP_COMPACT_HELPER
      : `${OPERATOR_ATTENTION_KIND_STRIP_HELPER} ${formatAttentionKindList()}.`;

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid="operator-attention-kind-strip"
      data-variant={variant}
    >
      {helper}
      {variant === "default" ? (
        <span className="sr-only" data-testid="operator-attention-kind-strip-inventory">
          {OPERATOR_ATTENTION_KIND_IDS.join(",")}
        </span>
      ) : null}
    </p>
  );
}
