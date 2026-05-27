"use client";

import { Badge } from "@/components/ui/badge";
import {
  formatStructuralExecutionModeLabel,
  structuralExecutionModeBadgeTitle,
  StructuralExecutionModeWire,
} from "@/lib/structural-execution-mode";

export type StructuralExecutionModeBadgeProps = {
  readonly structuralExecutionMode: number | null | undefined;
  readonly className?: string;
};

/** INV-002 operator badge — persisted structural execution mode from the run record. */
export function StructuralExecutionModeBadge(props: StructuralExecutionModeBadgeProps) {
  const mode = props.structuralExecutionMode;

  if (mode === null || mode === undefined) {
    return null;
  }

  const label = formatStructuralExecutionModeLabel(mode);
  const title = structuralExecutionModeBadgeTitle(mode);

  const variant =
    mode === StructuralExecutionModeWire.Fallback || mode === StructuralExecutionModeWire.Mixed
      ? "outline"
      : "secondary";

  const toneClass =
    mode === StructuralExecutionModeWire.Fallback || mode === StructuralExecutionModeWire.Mixed
      ? "font-normal text-amber-900 dark:text-amber-200"
      : "font-normal";

  return (
    <Badge variant={variant} className={[toneClass, props.className].filter(Boolean).join(" ")} title={title}>
      {label} execution
    </Badge>
  );
}
