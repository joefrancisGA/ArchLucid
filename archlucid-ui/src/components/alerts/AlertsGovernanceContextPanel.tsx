import Link from "next/link";

import { InlineGuidance } from "@/components/InlineGuidance";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ALERTS_ABOUT_SUMMARY_LABEL,
  ALERTS_APPROVAL_QUEUE_GUIDANCE,
  ALERTS_HOW_ALERTS_WORK_LABEL,
  ALERTS_HOW_ALERTS_WORK_STEPS_OPERATOR,
  ALERTS_HOW_ALERTS_WORK_STEPS_READER,
  ALERTS_QUICK_GUIDANCE_BULLETS,
} from "@/lib/alerts-page-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type AlertsGovernanceContextPanelProps = {
  readonly canMutateAlertInbox: boolean;
};

/** Compact governance cues for the alerts inbox — inline with the page header, not a competing hero card. */
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
      <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-al-text-primary">
        <InlineGuidance label={OPERATOR_NAV_LINK_LABELS.governanceWorkflow} labelTestId="inline-guidance-approval-queue">
          {ALERTS_APPROVAL_QUEUE_GUIDANCE}
        </InlineGuidance>
        <Link href="/governance" className={cn(OPERATOR_LINK.inline, "shrink-0")}>
          Open governance
        </Link>
      </p>

      <details data-testid="alerts-how-alerts-work-disclosure">
        <summary className="cursor-pointer font-medium text-al-text-primary">{ALERTS_ABOUT_SUMMARY_LABEL}</summary>
        <ul className="m-0 mt-2 list-disc space-y-1 pl-5">
          {ALERTS_QUICK_GUIDANCE_BULLETS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="m-0 mt-3 font-medium text-al-text-primary">{ALERTS_HOW_ALERTS_WORK_LABEL}</p>
        <ol className="m-0 mt-1 list-decimal space-y-1 pl-5">
          {howAlertsWorkSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
    </div>
  );
}
