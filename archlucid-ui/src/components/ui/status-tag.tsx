import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ENTERPRISE_STATUS_LABELS,
  enterpriseStatusTagClass,
  type EnterpriseStatusKind,
} from "@/lib/design-tokens";

export type StatusTagProps = {
  kind: EnterpriseStatusKind;
  /** Override canonical label when mapping legacy API strings. */
  label?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/** Canonical enterprise status chip (Carbon-inspired). */
export function StatusTag({
  kind,
  label,
  className,
  ...rest
}: StatusTagProps): React.ReactElement {
  const display = (label ?? ENTERPRISE_STATUS_LABELS[kind]).trim();

  return (
    <Badge
      variant="outline"
      className={cn(enterpriseStatusTagClass(kind), className)}
      aria-label={`Status: ${display}`}
      {...rest}
    >
      {display}
    </Badge>
  );
}
