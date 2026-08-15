import type { HTMLAttributes, ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { resolveEnterpriseStatusKind } from "@/lib/enterprise-status-kind-resolver";
import { cn } from "@/lib/utils";

export type HealthStatusTagProps = {
  /** Raw API or operator-facing health status display string. */
  status: string;
  /** Override visible label while keeping resolver input from `status` when omitted. */
  label?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/**
 * Health / ops readiness metadata chip — {@link StatusTag} + **TB-2285** resolver (**TB-2287**).
 */
export function HealthStatusTag({
  status,
  label,
  className,
  ...rest
}: HealthStatusTagProps): ReactElement {
  const displaySource = label ?? status;
  const display = displaySource.trim().length > 0 ? displaySource.trim() : "—";
  const kind = resolveEnterpriseStatusKind(display, "health");

  return <StatusTag kind={kind} label={display} className={cn(className)} {...rest} />;
}
