"use client";

import { StatusTag } from "@/components/ui/status-tag";
import {
  formatStructuralExecutionModeLabel,
  structuralExecutionModeBadgeTitle,
  StructuralExecutionModeWire,
} from "@/lib/structural-execution-mode";

export type StructuralExecutionModeBadgeProps = {
  readonly structuralExecutionMode: number | null | undefined;
  readonly className?: string;
};

/** INV-002 operator metadata label — persisted structural execution mode from the run record. */
export function StructuralExecutionModeBadge(props: StructuralExecutionModeBadgeProps) {
  const mode = props.structuralExecutionMode;

  if (mode === null || mode === undefined) {
    return null;
  }

  const label = formatStructuralExecutionModeLabel(mode);
  const title = structuralExecutionModeBadgeTitle(mode);

  const kind =
    mode === StructuralExecutionModeWire.Fallback || mode === StructuralExecutionModeWire.Mixed
      ? "needs-attention"
      : "neutral";

  return (
    <StatusTag
      kind={kind}
      label={`${label} execution`}
      className={props.className}
      title={title}
    />
  );
}
