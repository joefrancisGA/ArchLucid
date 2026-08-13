"use client";

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
import type { SlackSetupStep } from "@/lib/slack-integration-present";
import { cn } from "@/lib/utils";

type SlackIntegrationAsideProps = {
  readonly className?: string;
  readonly loading: boolean;
  readonly activeDestinationCount: number;
  readonly setupSteps: readonly SlackSetupStep[];
  readonly emphasizedSetupStepId: string;
};

export function SlackIntegrationAside(props: SlackIntegrationAsideProps): React.ReactElement {
  const statusLabel = props.loading
    ? "Loading"
    : slackIntegrationConfigurationStatusLabel(props.activeDestinationCount);
  const statusKind = props.loading ? "neutral" : slackIntegrationConfigurationStatusTagKind(props.activeDestinationCount);

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

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SLACK_SETUP_PROGRESS_TITLE}</h2>
        <ol
          className={cn("m-0 mt-3 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}
          aria-label="Slack setup progress"
          data-testid="slack-setup-progress"
        >
          {props.setupSteps.map((step) => (
            <li
              key={step.id}
              className="flex items-start justify-between gap-3"
              aria-current={step.id === props.emphasizedSetupStepId ? "step" : undefined}
              data-testid={`slack-setup-step-${step.id}`}
              data-emphasized={step.id === props.emphasizedSetupStepId ? "true" : undefined}
            >
              <span
                className={cn(
                  step.complete ? "text-al-text-primary" : "text-al-text-secondary",
                  step.id === props.emphasizedSetupStepId ? "font-medium text-al-text-primary" : undefined,
                )}
              >
                {step.label}
              </span>
              <StatusTag
                kind={step.complete ? "ready" : step.id === props.emphasizedSetupStepId ? "in-progress" : "neutral"}
                label={step.complete ? "Done" : "Pending"}
              />
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SLACK_SECURITY_ASIDE_TITLE}</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SLACK_INTEGRATION_SECURITY_NOTE}
        </p>
      </div>
    </aside>
  );
}
