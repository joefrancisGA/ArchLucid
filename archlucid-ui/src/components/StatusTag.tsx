import type { HTMLAttributes } from "react";

import { Badge } from "@/components/ui/badge";
import {
  ENTERPRISE_STATUS_LABELS,
  enterpriseStatusTagClass,
  type EnterpriseStatusKind,
} from "@/lib/design-tokens";
import { STATUS_PILL_BASE } from "@/lib/status-pill-domain-classes";
import { cn } from "@/lib/utils";

export type StatusTagProps = {
  kind: EnterpriseStatusKind;
  /** Override the canonical enterprise label when mapping from legacy API strings. */
  label?: string;
  className?: string;
  uppercase?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/**
 * Wave 0 enterprise status chip — canonical Ready / Needs attention / Blocked / Approved labels.
 */
export function StatusTag({
  kind,
  label,
  className,
  uppercase = false,
  ...rest
}: StatusTagProps): React.ReactElement {
  const display = (label ?? ENTERPRISE_STATUS_LABELS[kind]).trim();

  return (
    <Badge
      variant="outline"
      className={cn(STATUS_PILL_BASE, enterpriseStatusTagClass(kind), uppercase ? "uppercase" : null, className)}
      aria-label={`Status: ${display}`}
      {...rest}
    >
      {display}
    </Badge>
  );
}
