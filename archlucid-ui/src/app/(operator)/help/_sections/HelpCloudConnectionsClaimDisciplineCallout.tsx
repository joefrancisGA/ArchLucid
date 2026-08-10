import Link from "next/link";

import { Info } from "lucide-react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_LEAD,
  CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_STATUS_LABEL,
  CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_TRAIL,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
} from "@/lib/cloud-connections-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Orientation-only claim discipline for `/help/cloud-connections` (HCE). */
export function HelpCloudConnectionsClaimDisciplineCallout(): React.ReactElement {
  return (
    <aside
      role="complementary"
      aria-labelledby="help-cloud-connections-orientation-heading"
      className={cn(DESIGN_TOKENS.callout.info, "flex gap-3")}
      data-testid="help-cloud-connections-claim-discipline"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-al-text-secondary" aria-hidden />
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            id="help-cloud-connections-orientation-heading"
            className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE}
          </h3>
          <StatusTag
            kind="neutral"
            label={CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_STATUS_LABEL}
            data-testid="help-cloud-connections-claim-discipline-status"
          />
        </div>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          {CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_LEAD} Open{" "}
          <Link href="/security-trust" className={OPERATOR_LINK.inline}>
            Assurance status
          </Link>{" "}
          or the live{" "}
          <Link href={CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href} className={OPERATOR_LINK.inline}>
            Cloud connections hub
          </Link>{" "}
          {CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_TRAIL}
        </p>
      </div>
    </aside>
  );
}
