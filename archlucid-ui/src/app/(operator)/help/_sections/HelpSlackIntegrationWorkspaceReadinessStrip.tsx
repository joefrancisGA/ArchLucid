"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  SLACK_INTEGRATION_HELP_READINESS_FORBIDDEN_MESSAGE,
  SLACK_INTEGRATION_HELP_READINESS_SECTION_TITLE,
  SLACK_INTEGRATION_HELP_WEBHOOK_PRECONDITION,
} from "@/lib/slack-integration-help-guide-content";
import type { SlackIntegrationHelpWorkspaceReadinessSnapshot } from "@/lib/use-slack-integration-help-workspace-readiness";
import { useSlackIntegrationHelpWorkspaceReadiness } from "@/lib/use-slack-integration-help-workspace-readiness";

export const HELP_SLACK_INTEGRATION_WORKSPACE_READINESS_HEADING_ID =
  "help-slack-integration-workspace-readiness-heading";

type HelpSlackIntegrationWorkspaceReadinessStripProps = {
  readonly readiness?: SlackIntegrationHelpWorkspaceReadinessSnapshot;
  readonly showSetupPrecondition?: boolean;
};

/** Live Slack destination configuration for `/help/slack-integration`. */
export function HelpSlackIntegrationWorkspaceReadinessStrip(
  props: HelpSlackIntegrationWorkspaceReadinessStripProps = {},
): React.ReactElement {
  const hookReadiness = useSlackIntegrationHelpWorkspaceReadiness();
  const readiness = props.readiness ?? hookReadiness;
  const showSetupPrecondition = props.showSetupPrecondition ?? false;

  const scopeLine = useMemo((): string | null => {
    if (readiness.loading || readiness.workspaceScopeLabel === null) {
      return null;
    }

    return readiness.workspaceScopeLabel;
  }, [readiness.loading, readiness.workspaceScopeLabel]);

  const asOfLabel = useMemo((): string | null => {
    if (readiness.loading) {
      return "Loading…";
    }

    if (readiness.loadForbidden || readiness.loadedAtUtc === null) {
      return null;
    }

    return `As of ${formatRelativeTime(readiness.loadedAtUtc)}`;
  }, [readiness.loadForbidden, readiness.loadedAtUtc, readiness.loading]);

  const headerMeta = [scopeLine, asOfLabel].filter((part): part is string => part !== null).join(" · ");

  const shouldShowPrecondition =
    showSetupPrecondition
    && !readiness.loading
    && !readiness.loadForbidden
    && !readiness.loadFailed
    && readiness.activeDestinationCount === 0;

  return (
    <section
      aria-busy={readiness.loading ? true : undefined}
      aria-labelledby={HELP_SLACK_INTEGRATION_WORKSPACE_READINESS_HEADING_ID}
      aria-live="polite"
      className="space-y-3"
      data-testid="help-slack-integration-workspace-readiness"
    >
      <header className="space-y-1">
        <h3
          id={HELP_SLACK_INTEGRATION_WORKSPACE_READINESS_HEADING_ID}
          className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {SLACK_INTEGRATION_HELP_READINESS_SECTION_TITLE}
        </h3>
        {headerMeta.length > 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{headerMeta}</p>
        ) : null}
      </header>

      {readiness.loadForbidden ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-slack-integration-workspace-readiness-forbidden"
        >
          {SLACK_INTEGRATION_HELP_READINESS_FORBIDDEN_MESSAGE}
        </p>
      ) : readiness.loadFailed ? (
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-slack-integration-workspace-readiness-failed"
          >
            Slack destination status could not be loaded.
          </p>
          <Button
            data-testid="help-slack-integration-workspace-readiness-retry"
            onClick={() => {
              readiness.reload();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div data-testid="help-slack-integration-workspace-readiness-status">
          <StatusTag
            kind={readiness.loading ? "neutral" : readiness.configurationStatusKind}
            label={readiness.loading ? "Loading" : readiness.configurationStatusLabel}
          />
        </div>
      )}

      {shouldShowPrecondition ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-slack-integration-webhook-precondition"
        >
          {SLACK_INTEGRATION_HELP_WEBHOOK_PRECONDITION}
        </p>
      ) : null}
    </section>
  );
}
