import type { HTMLAttributes } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type BooleanStatusChipProps = {
  value: boolean;
  /** Label when `value` is true. */
  trueLabel?: string;
  /** Label when `value` is false. */
  falseLabel?: string;
  /** When true, the false state uses needs-attention styling; otherwise muted. */
  falseIsAttention?: boolean;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

function resolveKind(value: boolean, falseIsAttention: boolean): EnterpriseStatusKind {
  if (value) {
    return "ready";
  }

  if (falseIsAttention) {
    return "needs-attention";
  }

  return "neutral";
}

/** Canonical boolean Active/Inactive (or custom labels) chip for operator tables. */
export function BooleanStatusChip({
  value,
  trueLabel = "Active",
  falseLabel = "Inactive",
  falseIsAttention = true,
  className,
  ...rest
}: BooleanStatusChipProps): React.ReactElement {
  const kind = resolveKind(value, falseIsAttention);
  const label = value ? trueLabel : falseLabel;

  return <StatusTag kind={kind} label={label} className={className} {...rest} />;
}
