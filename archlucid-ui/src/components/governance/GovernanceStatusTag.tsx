import type { HTMLAttributes, ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { resolveEnterpriseStatusKind } from "@/lib/enterprise-status-kind-resolver";
import { cn } from "@/lib/utils";

export type GovernanceStatusTagProps = {
  /** Raw API or buyer-polished governance status display string. */
  status: string;
  /** Override visible label while keeping resolver input from `status` when omitted. */
  label?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/**
 * Governance workflow / gate metadata chip — {@link StatusTag} + **TB-2285** resolver (**TB-2286**).
 */
export function GovernanceStatusTag({
  status,
  label,
  className,
  ...rest
}: GovernanceStatusTagProps): ReactElement {
  const displaySource = label ?? status;
  const display = displaySource.trim().length > 0 ? displaySource.trim() : " — ";
  const kind = resolveEnterpriseStatusKind(display, "governance");

  return <StatusTag kind={kind} label={display} className={cn(className)} {...rest} />;
}
