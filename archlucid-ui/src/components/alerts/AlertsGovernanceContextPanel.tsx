import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ALERTS_CONTEXT_NOTE } from "@/lib/alerts-page-copy";
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
      <p className="m-0">{ALERTS_CONTEXT_NOTE}</p>
    </div>
  );
}
