import Link from "next/link";
import type { ReactElement } from "react";

import {
  ALERT_RULES_NOTIFICATION_EXTERNAL_CONFIGURED,
  ALERT_RULES_NOTIFICATION_EXTERNAL_NOT_CONFIGURED,
  ALERT_RULES_NOTIFICATION_IN_APP_DISABLED,
  ALERT_RULES_NOTIFICATION_IN_APP_ENABLED,
  ALERT_RULES_NOTIFICATION_READINESS_HEADING,
  ALERT_RULES_NOTIFICATIONS_TAB_LINK_LABEL,
  ALERT_RULES_SCOPE_HEADING,
} from "@/lib/alert-rule-conditions-copy";
import {
  describeAlertRuleScope,
  resolveAlertRuleNotificationReadiness,
  type AlertRuleFormInput,
} from "@/lib/alert-rule-conditions";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertRule } from "@/types/alerts";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import { cn } from "@/lib/utils";

export type AlertRuleNotificationReadinessPanelProps = {
  readonly scopeRule: Pick<AlertRule, "projectId">;
  readonly readinessRule: Pick<AlertRule, "isEnabled">;
  readonly routingSubscriptions: readonly AlertRoutingSubscription[];
  readonly draftForm: AlertRuleFormInput;
};

export function AlertRuleNotificationReadinessPanel(
  props: AlertRuleNotificationReadinessPanelProps,
): ReactElement {
  const readiness = resolveAlertRuleNotificationReadiness(props.readinessRule, props.routingSubscriptions);
  const scopeCopy = describeAlertRuleScope(props.scopeRule);

  return (
    <aside
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      aria-labelledby="alert-rule-readiness-heading"
    >
      <h3 id="alert-rule-readiness-heading" className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {ALERT_RULES_NOTIFICATION_READINESS_HEADING}
      </h3>
      <h4 className={cn("mb-1 mt-0", OPERATOR_TYPOGRAPHY.body)}>{ALERT_RULES_SCOPE_HEADING}</h4>
      <p
        className={cn("mb-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="alert-rule-scope-preview"
      >
        {scopeCopy}
      </p>
      <ul className={cn("mb-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
        <li data-testid="alert-rule-readiness-in-app">
          {readiness.inAppAlertsEnabled
            ? ALERT_RULES_NOTIFICATION_IN_APP_ENABLED
            : ALERT_RULES_NOTIFICATION_IN_APP_DISABLED}
        </li>
        <li data-testid="alert-rule-readiness-external">
          {readiness.externalNotificationsConfigured
            ? ALERT_RULES_NOTIFICATION_EXTERNAL_CONFIGURED
            : ALERT_RULES_NOTIFICATION_EXTERNAL_NOT_CONFIGURED}
        </li>
      </ul>
      {!readiness.externalNotificationsConfigured ? (
        <p className="mb-0 mt-3">
          <Link
            href={governanceAlertRulesTabHref("notifications")}
            className="text-al-link underline-offset-2 hover:underline"
          >
            {ALERT_RULES_NOTIFICATIONS_TAB_LINK_LABEL}
          </Link>
        </p>
      ) : null}
      <p className="sr-only" data-testid="alert-rule-readiness-draft-priority">
        Draft alert priority {props.draftForm.alertPriority}
      </p>
    </aside>
  );
}
