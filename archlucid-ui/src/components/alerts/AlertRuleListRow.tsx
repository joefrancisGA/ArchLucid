import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTableCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ALERT_RULES_SIMULATE_BUTTON_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import {
  alertRuleActiveStatusKind,
  alertRuleActiveStatusLabel,
  alertRuleNotificationReadinessPresentation,
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
  const readinessPresentation = alertRuleNotificationReadinessPresentation(readiness);
  const scopeCopy = describeAlertRuleScope(props.rule);
  const statusLabel = alertRuleActiveStatusLabel(props.rule.isEnabled);

  return (
    <EnterpriseTableRow
      aria-label={`Alert rule ${props.rule.name}`}
      data-testid={`alert-rule-row-${props.rule.ruleId}`}
    >
      <EnterpriseTableCell>
        <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {props.rule.name}
        </span>
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{summary}</span>
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{scopeCopy}</span>
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {labelForAlertPriority(props.rule.severity)}
        </span>
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <StatusTag kind={alertRuleActiveStatusKind(props.rule.isEnabled)} label={statusLabel} />
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <StatusTag kind={readinessPresentation.kind} label={readinessPresentation.label} />
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Dry-run which reviews would trigger notifications for this rule"
          aria-label={`${ALERT_RULES_SIMULATE_BUTTON_LABEL} ${props.rule.name}`}
          onClick={() => props.onSimulate(props.rule)}
        >
          {ALERT_RULES_SIMULATE_BUTTON_LABEL}
        </Button>
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}
