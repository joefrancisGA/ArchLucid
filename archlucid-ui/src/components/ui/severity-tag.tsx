import type { HTMLAttributes } from "react";

import { Badge } from "@/components/ui/badge";
import {
  normalizeFindingSeverity,
  SEVERITY_LABELS,
  severityTagClass,
  type FindingSeverityKind,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type SeverityTagProps = {
  /** Raw severity from API; normalized before display. */
  severity: string | null | undefined;
  kind?: FindingSeverityKind;
  label?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/** Finding severity chip aligned with enterprise token palette. */
export function SeverityTag({
  severity,
  kind,
  label,
  className,
  ...rest
}: SeverityTagProps): React.ReactElement {
  const resolved = kind ?? normalizeFindingSeverity(severity);
  const display = (label ?? SEVERITY_LABELS[resolved]).trim();

  return (
    <Badge
      variant="outline"
      className={cn(severityTagClass(resolved), className)}
      aria-label={`Severity: ${display}`}
      {...rest}
    >
      {display}
    </Badge>
  );
}
