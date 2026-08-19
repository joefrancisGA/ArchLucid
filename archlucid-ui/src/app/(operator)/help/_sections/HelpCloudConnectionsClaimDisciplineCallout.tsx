import Link from "next/link";

import { Info } from "lucide-react";

import {
  CLOUD_CONNECTIONS_HELP_ORIENTATION_BOUNDARY_AFTER_LINKS,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_BOUNDARY_BEFORE_LINKS,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_ID,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_LEAD,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
} from "@/lib/cloud-connections-help-guide-content";
import {
  DESIGN_TOKENS,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Orientation callout for `/help/cloud-connections` (HCE). */
export function HelpCloudConnectionsClaimDisciplineCallout(): React.ReactElement {
  return (
    <aside
      id={CLOUD_CONNECTIONS_HELP_ORIENTATION_ID}
      role="complementary"
      aria-labelledby="help-cloud-connections-orientation-heading"
      className={cn(
        DESIGN_TOKENS.callout.info,
        OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
        "flex scroll-mt-24 gap-3",
      )}
      data-testid="help-cloud-connections-orientation"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-al-text-secondary" aria-hidden />
      <div className="min-w-0 space-y-2">
        <h3
          id="help-cloud-connections-orientation-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE}
        </h3>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          {CLOUD_CONNECTIONS_HELP_ORIENTATION_LEAD} {CLOUD_CONNECTIONS_HELP_ORIENTATION_BOUNDARY_BEFORE_LINKS}{" "}
          <Link href="/assurance-status" className={OPERATOR_LINK.inline}>
            Assurance status
          </Link>{" "}
          or the live{" "}
          <Link href={CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href} className={OPERATOR_LINK.inline}>
            Cloud connections hub
          </Link>{" "}
          {CLOUD_CONNECTIONS_HELP_ORIENTATION_BOUNDARY_AFTER_LINKS}
        </p>
      </div>
    </aside>
  );
}
