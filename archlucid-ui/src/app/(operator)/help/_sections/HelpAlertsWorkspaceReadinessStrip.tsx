"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";

import {
  ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_HELPER,
  ALERTS_HELP_READINESS_FORBIDDEN_MESSAGE,
  ALERTS_HELP_READINESS_LABELS,
  ALERTS_HELP_READINESS_SECTION_TITLE,
} from "@/lib/alerts-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import type { AlertsHelpWorkspaceReadinessSnapshot } from "@/lib/use-alerts-help-workspace-readiness";

export const HELP_ALERTS_WORKSPACE_READINESS_HEADING_ID = "help-alerts-workspace-readiness-heading";

type ReadinessMetricProps = {
  readonly label: string;
  readonly value: string;
  readonly statusKind: EnterpriseStatusKind;
  readonly helperText?: string;
};

function ReadinessMetric(props: ReadinessMetricProps): React.ReactElement {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <div className="mt-1">
        <StatusTag kind={props.statusKind} label={props.value} />
      </div>
      {props.helperText !== undefined ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.helperText}</p>
      ) : null}
    </div>
  );
}

type HelpAlertsWorkspaceReadinessStripProps = {
  readonly readiness: AlertsHelpWorkspaceReadinessSnapshot;
};

/** Compact workspace alert readiness for `/help/alerts` — live API data only. */
export function HelpAlertsWorkspaceReadinessStrip(
  props: HelpAlertsWorkspaceReadinessStripProps,
): React.ReactElement {
  const { readiness } = props;

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

    if (readiness.loadedAtUtc === null) {
      return null;
    }

    return `As of ${formatRelativeTime(readiness.loadedAtUtc)}`;
  }, [readiness.loadedAtUtc, readiness.loading]);

  const headerMeta = [scopeLine, asOfLabel].filter((part): part is string => part !== null).join(" · ");

  return (
    <section
      aria-busy={readiness.loading ? true : undefined}
      aria-labelledby={HELP_ALERTS_WORKSPACE_READINESS_HEADING_ID}
      aria-live="polite"
      className="space-y-3"
      data-testid="help-alerts-workspace-readiness"
    >
      <header className="space-y-1">
        <h2
          id={HELP_ALERTS_WORKSPACE_READINESS_HEADING_ID}
          className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {ALERTS_HELP_READINESS_SECTION_TITLE}
        </h2>
        {headerMeta.length > 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{headerMeta}</p>
        ) : null}
      </header>

      {readiness.loadForbidden ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-alerts-workspace-readiness-forbidden"
        >
          {ALERTS_HELP_READINESS_FORBIDDEN_MESSAGE}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ReadinessMetric
            label={ALERTS_HELP_READINESS_LABELS.enabledRules}
            statusKind={readiness.enabledRulesStatusKind}
            value={readiness.enabledRulesLabel}
          />
          <ReadinessMetric
            label={ALERTS_HELP_READINESS_LABELS.openAlerts}
            statusKind={readiness.openAlertsStatusKind}
            value={readiness.openAlertsLabel}
          />
          <ReadinessMetric
            label={ALERTS_HELP_READINESS_LABELS.routingDestinations}
            statusKind={readiness.routingDestinationsStatusKind}
            value={readiness.routingDestinationsLabel}
          />
          <ReadinessMetric
            helperText={ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_HELPER}
            label={ALERTS_HELP_READINESS_LABELS.mostRecentAlertActivity}
            statusKind={readiness.lastEvaluationStatusKind}
            value={readiness.lastEvaluationLabel}
          />
        </div>
      )}

      {readiness.loadFailed ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Workspace alert status could not be loaded.
          </p>
          <Button
            data-testid="help-alerts-workspace-readiness-retry"
            onClick={() => {
              void readiness.reload();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : null}
    </section>
  );
}
