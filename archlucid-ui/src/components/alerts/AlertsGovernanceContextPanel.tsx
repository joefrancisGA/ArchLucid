import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ALERTS_CONTEXT_NOTE, ALERTS_HOW_ALERTS_WORK_LABEL } from "@/lib/alerts-page-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

export type AlertsGovernanceContextPanelProps = {
  readonly canMutateAlertInbox: boolean;
};

/** Compact orientation for the alerts inbox — detailed guidance lives in contextual help. */
export function AlertsGovernanceContextPanel(
  props: AlertsGovernanceContextPanelProps,
): React.JSX.Element {
  void props;
  return (
    <div
      className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="alerts-governance-context-panel"
    >
      <p className="m-0">
        {ALERTS_CONTEXT_NOTE}{" "}
        <Link
          href={inAppHelpHref("alerts")}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="alerts-how-alerts-work-link"
        >
          {ALERTS_HOW_ALERTS_WORK_LABEL}
        </Link>
      </p>
    </div>
  );
}
