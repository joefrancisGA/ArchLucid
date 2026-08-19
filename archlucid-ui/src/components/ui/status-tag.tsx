import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

import { MetadataStatusLabel } from "@/components/ui/metadata-status-label";
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
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/** Canonical enterprise status metadata label (Carbon-inspired). */
export function StatusTag({
  kind,
  label,
  className,
  ...rest
}: StatusTagProps): React.ReactElement {
  const display = (label ?? ENTERPRISE_STATUS_LABELS[kind]).trim();

  return (
    <MetadataStatusLabel
      className={cn(enterpriseStatusTagClass(kind), className)}
      aria-label={`Status: ${display}`}
      {...rest}
    >
      {display}
    </MetadataStatusLabel>
  );
}
