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

/** Compact governance orientation for the alerts hub — approval queue cue, scan bullets, and deeper help on demand. */
export function AlertsGovernanceContextPanel({
  canMutateAlertInbox,
}: AlertsGovernanceContextPanelProps): React.JSX.Element {
  const howAlertsWorkSteps = canMutateAlertInbox
    ? ALERTS_HOW_ALERTS_WORK_STEPS_OPERATOR
    : ALERTS_HOW_ALERTS_WORK_STEPS_READER;

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/40",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="alerts-governance-context-panel"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <InlineGuidance label={OPERATOR_NAV_LINK_LABELS.governanceWorkflow} labelTestId="inline-guidance-approval-queue">
          {ALERTS_APPROVAL_QUEUE_GUIDANCE}
        </InlineGuidance>{" "}
        <Link href="/governance" className={OPERATOR_LINK.inline}>
          Open approval queue
        </Link>
      </p>

      <div className="mt-3">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>{ALERTS_ABOUT_SUMMARY_LABEL}</p>
        <ul
          className={cn(
            "m-0 mt-1.5 list-disc space-y-1 pl-5 text-al-text-secondary",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {ALERTS_QUICK_GUIDANCE_BULLETS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <details className="mt-3" data-testid="alerts-how-alerts-work-disclosure">
        <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
          {ALERTS_HOW_ALERTS_WORK_LABEL}
        </summary>
        <ol
          className={cn(
            "mb-0 mt-2 list-decimal space-y-1.5 pl-5 text-al-text-secondary",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {howAlertsWorkSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
    </div>
  );
}
