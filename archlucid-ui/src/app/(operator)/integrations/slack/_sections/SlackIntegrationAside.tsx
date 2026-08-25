"use client";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SLACK_CONFIGURATION_STATUS_ASIDE_TITLE,
  SLACK_INTEGRATION_SECURITY_NOTE,
  SLACK_SECURITY_ASIDE_TITLE,
  SLACK_SETUP_PROGRESS_TITLE,
  slackIntegrationConfigurationStatusLabel,
  slackIntegrationConfigurationStatusTagKind,
} from "@/lib/slack-integration-page-copy";
import {
  resolveSlackIntegrationConnectSteps,
  resolveSlackIntegrationEmphasizedStepId,
} from "@/lib/slack-integration-connect-checklist";
import { cn } from "@/lib/utils";

type SlackIntegrationAsideProps = {
  readonly className?: string;
  readonly loading: boolean;
  readonly totalDestinationCount: number;
  readonly activeDestinationCount: number;
  readonly formTestSucceeded: boolean;
};

export function SlackIntegrationAside(props: SlackIntegrationAsideProps): React.ReactElement {
  const statusLabel = props.loading
    ? "Loading"
    : slackIntegrationConfigurationStatusLabel(props.activeDestinationCount);
  const statusKind = props.loading ? "neutral" : slackIntegrationConfigurationStatusTagKind(props.activeDestinationCount);
  const checklistInput = {
    totalDestinationCount: props.totalDestinationCount,
    activeDestinationCount: props.activeDestinationCount,
    formTestSucceeded: props.formTestSucceeded,
  };
  const connectSteps = resolveSlackIntegrationConnectSteps(checklistInput);
  const emphasizedStepId = resolveSlackIntegrationEmphasizedStepId(checklistInput);

  return (
    <aside
      className={cn("space-y-4", props.className)}
      data-testid="slack-integration-aside"
      data-operator-side-rail-kind="none"
    >
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SLACK_CONFIGURATION_STATUS_ASIDE_TITLE}</h2>
        <div className="mt-3">
          <StatusTag kind={statusKind} label={statusLabel} data-testid="slack-aside-configuration-status" />
        </div>
      </div>

      <IntegrationConnectChecklist
        title={SLACK_SETUP_PROGRESS_TITLE}
        steps={connectSteps}
        emphasizedStepId={emphasizedStepId}
        testIdPrefix="slack"
      />

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SLACK_SECURITY_ASIDE_TITLE}</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SLACK_INTEGRATION_SECURITY_NOTE}
        </p>
      </div>
    </aside>
  );
}
