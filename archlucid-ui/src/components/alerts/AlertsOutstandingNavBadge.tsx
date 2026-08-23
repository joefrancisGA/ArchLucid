"use client";

import { useAlertsInboxSummaryQuery } from "@/components/alerts/use-alerts-inbox-queries";
import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { operatorAttentionKindLabel } from "@/lib/operator/operator-attention-taxonomy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Count badge beside Alerts nav when open (outstanding) alerts exist. */
export function AlertsOutstandingNavBadge(): React.JSX.Element | null {
  const queryEnabled = useOperatorShellStatusConcernFetchEnabled();
  const { summary } = useAlertsInboxSummaryQuery({ initialModel: null, enabled: queryEnabled });
  const count = summary.open;

  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-600 px-1.5 font-bold text-white",
        OPERATOR_TYPOGRAPHY.badge,
      )}
      aria-label={
        count === 1
          ? `1 ${operatorAttentionKindLabel("alerts").toLowerCase()}`
          : `${count} ${operatorAttentionKindLabel("alerts").toLowerCase()}`
      }
      data-testid="alerts-outstanding-nav-badge"
      data-attention-partition="alerts"
    >
      {count}
    </span>
  );
}
