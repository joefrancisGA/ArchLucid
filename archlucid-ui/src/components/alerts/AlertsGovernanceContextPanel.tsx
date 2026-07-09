import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ALERTS_CONTEXT_NOTE,
  ALERTS_HOW_ALERTS_WORK_LABEL,
  ALERTS_HOW_ALERTS_WORK_STEPS_OPERATOR,
  ALERTS_HOW_ALERTS_WORK_STEPS_READER,
  ALERTS_QUICK_GUIDANCE_BULLETS,
} from "@/lib/alerts-page-copy";
import { cn } from "@/lib/utils";

export type AlertsGovernanceContextPanelProps = {
  readonly canMutateAlertInbox: boolean;
};

/** Compact governance cues for the alerts inbox — contextual note plus collapsed help only. */
export function AlertsGovernanceContextPanel({
  canMutateAlertInbox,
}: AlertsGovernanceContextPanelProps): React.JSX.Element {
  const howAlertsWorkSteps = canMutateAlertInbox
    ? ALERTS_HOW_ALERTS_WORK_STEPS_OPERATOR
    : ALERTS_HOW_ALERTS_WORK_STEPS_READER;

  return (
    <div
      className={cn("space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="alerts-governance-context-panel"
    >
      <p className="m-0 text-al-text-secondary">{ALERTS_CONTEXT_NOTE}</p>

      <details data-testid="alerts-how-alerts-work-disclosure">
        <summary className="cursor-pointer font-medium text-al-text-primary">{ALERTS_HOW_ALERTS_WORK_LABEL}</summary>
        <ul className="m-0 mt-2 list-disc space-y-1 pl-5">
          {ALERTS_QUICK_GUIDANCE_BULLETS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <ol className="m-0 mt-3 list-decimal space-y-1 pl-5">
          {howAlertsWorkSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="m-0 mt-3">
          <Link href="/help/alerts" className={cn(OPERATOR_LINK.inline, "font-medium")}>
            Open alerts help
          </Link>
        </p>
      </details>
    </div>
  );
}
