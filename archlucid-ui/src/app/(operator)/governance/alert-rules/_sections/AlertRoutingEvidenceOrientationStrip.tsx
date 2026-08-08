"use client";

import { ALERT_ROUTING_CLAIM_DISCIPLINE } from "@/lib/alert-routing-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim discipline for Alert rules → Notifications tab (Sources chrome removed TB-2092). */
export function AlertRoutingEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="mb-4 space-y-3" data-testid="alert-routing-orientation">
      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="alert-routing-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Delivery configuration only
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{ALERT_ROUTING_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
