import type { ReactElement } from "react";

import { AttentionLinkChip } from "@/components/operator/AttentionLinkChip";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  formatOperatorAttentionChipAriaLabel,
  operatorAttentionChipNeedsAction,
} from "@/lib/operator/operator-attention-chip-needs-action";
import {
  OPERATOR_ATTENTION_KIND_LABELS,
  type OperatorAttentionKindId,
} from "@/lib/operator/operator-attention-taxonomy";
import { cn } from "@/lib/utils";

export type OperatorAttentionKindChipProps = {
  readonly kind: OperatorAttentionKindId;
  readonly href: string;
  readonly count: number;
  readonly selected: boolean;
};

/** Compact attention-kind chip — same height for idle and needs-action states. */
export function OperatorAttentionKindChip(
  props: OperatorAttentionKindChipProps,
): ReactElement {
  const label = OPERATOR_ATTENTION_KIND_LABELS[props.kind];
  const needsAction = operatorAttentionChipNeedsAction(props.count);
  const deEmphasized = props.count === 0;

  return (
    <AttentionLinkChip
      href={props.href}
      className={buyerFilterChipClass(props.selected, false, deEmphasized, needsAction)}
      aria-current={props.selected ? "page" : undefined}
      aria-label={formatOperatorAttentionChipAriaLabel(label, props.count)}
      data-testid={`operator-attention-kind-chip-${props.kind}`}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          props.count > 0 ? "text-al-text-primary" : "text-al-text-secondary",
        )}
        aria-hidden="true"
      >
        ({props.count})
      </span>
    </AttentionLinkChip>
  );
}
