import { AlertTriangle, CheckCircle2, CircleHelp, MinusCircle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { HealthStatusTag } from "@/components/health-dashboard/HealthStatusTag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  resolveHealthDisplaySeverity,
  type HealthDisplaySeverity,
} from "@/lib/health-readiness-presentation";

/** Shape cue per severity so status survives grayscale, color-blindness, and 11px chip text. */
const SEVERITY_ICON: Readonly<Record<HealthDisplaySeverity, LucideIcon>> = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  advisory: AlertTriangle,
  failing: XCircle,
  "not-configured": MinusCircle,
  unknown: CircleHelp,
};

export type HealthStatusChipProps = {
  readonly status: string;
  readonly className?: string;
  readonly testId?: string;
  /** Overrides the default `Status: {status}` screen-reader label. */
  readonly ariaLabel?: string;
};

/**
 * Health status chip: icon plus {@link HealthStatusTag}. Color alone cannot carry status on a
 * page where every row uses the same 11px badge scale.
 */
export function HealthStatusChip(props: HealthStatusChipProps): React.JSX.Element {
  const severity = resolveHealthDisplaySeverity(props.status);
  const Icon = SEVERITY_ICON[severity];

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5", props.className)} data-testid={props.testId}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0 text-al-text-secondary" />
      <HealthStatusTag
        status={props.status}
        aria-label={props.ariaLabel}
        className={cn("rounded-md px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge)}
      />
    </span>
  );
}
