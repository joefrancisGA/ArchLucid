import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  ALERT_RULES_LAST_TRIGGER_UNKNOWN,
  ALERT_RULES_SIMULATE_BUTTON_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import {
  alertRuleActiveStatusLabel,
  describeAlertRuleScope,
  formatPersistedAlertRuleSummary,
  labelForAlertPriority,
  resolveAlertRuleNotificationReadiness,
} from "@/lib/alert-rule-conditions";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertRule } from "@/types/alerts";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import { cn } from "@/lib/utils";

export type AlertRuleListRowProps = {
  readonly rule: AlertRule;
  readonly routingSubscriptions: readonly AlertRoutingSubscription[];
  readonly onSimulate: (rule: AlertRule) => void;
};

export function AlertRuleListRow(props: AlertRuleListRowProps): ReactElement {
  const summary = formatPersistedAlertRuleSummary(props.rule);
  const readiness = resolveAlertRuleNotificationReadiness(props.rule, props.routingSubscriptions);
  const scopeCopy = describeAlertRuleScope(props.rule);
  const statusLabel = alertRuleActiveStatusLabel(props.rule.isEnabled);

  return (
    <article
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      aria-label={`Alert rule ${props.rule.name}`}
      data-testid={`alert-rule-row-${props.rule.ruleId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className={cn("mt-0 break-words", OPERATOR_TYPOGRAPHY.sectionTitle)}>{props.rule.name}</h4>
          <p className={cn("mb-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{summary}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          title="Dry-run which reviews would trigger notifications for this rule"
          aria-label={`${ALERT_RULES_SIMULATE_BUTTON_LABEL} ${props.rule.name}`}
          onClick={() => props.onSimulate(props.rule)}
        >
          {ALERT_RULES_SIMULATE_BUTTON_LABEL}
        </Button>
      </div>
      <dl className={cn("mt-3 grid gap-1 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
        <div>
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Scope</dt>
          <dd className="m-0 text-neutral-600 dark:text-neutral-400">{scopeCopy}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Alert priority</dt>
          <dd className="m-0 text-neutral-600 dark:text-neutral-400">{labelForAlertPriority(props.rule.severity)}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Status</dt>
          <dd className="m-0 text-neutral-600 dark:text-neutral-400">{statusLabel}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Last triggered</dt>
          <dd className="m-0 text-neutral-600 dark:text-neutral-400">{ALERT_RULES_LAST_TRIGGER_UNKNOWN}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Notification readiness</dt>
          <dd className="m-0 text-neutral-600 dark:text-neutral-400">
            {readiness.externalNotificationsConfigured
              ? "In-app alerts enabled; external destinations configured"
              : "In-app alerts enabled; configure external destinations on Notifications tab"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
