import { AlertTriangle } from "lucide-react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE,
  CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_STATUS_LABEL,
} from "@/lib/cloud-connections-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Orientation-only claim discipline for `/help/cloud-connections` (HCE). */
export function HelpCloudConnectionsClaimDisciplineCallout(): React.ReactElement {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.warn, "flex gap-3")}
      data-testid="help-cloud-connections-claim-discipline"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200" aria-hidden />
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Orientation only
          </span>
          <StatusTag
            kind="neutral"
            label={CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_STATUS_LABEL}
            data-testid="help-cloud-connections-claim-discipline-status"
          />
        </div>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE}</p>
      </div>
    </aside>
  );
}
