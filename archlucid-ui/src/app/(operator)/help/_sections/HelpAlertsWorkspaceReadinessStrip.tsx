"use client";

import { cn } from "@/lib/utils";

import { ALERTS_HELP_READINESS_LABELS } from "@/lib/alerts-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useAlertsHelpWorkspaceReadiness } from "@/lib/use-alerts-help-workspace-readiness";

type ReadinessMetricProps = {
  readonly label: string;
  readonly value: string;
};

function ReadinessMetric(props: ReadinessMetricProps): React.ReactElement {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.value}
      </p>
    </div>
  );
}

/** Compact workspace alert readiness for `/help/alerts` — live API data only. */
export function HelpAlertsWorkspaceReadinessStrip(): React.ReactElement {
  const readiness = useAlertsHelpWorkspaceReadiness();

  return (
    <section
      aria-label="Workspace alert readiness"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="help-alerts-workspace-readiness"
    >
      <ReadinessMetric label={ALERTS_HELP_READINESS_LABELS.enabledRules} value={readiness.enabledRulesLabel} />
      <ReadinessMetric label={ALERTS_HELP_READINESS_LABELS.openAlerts} value={readiness.openAlertsLabel} />
      <ReadinessMetric
        label={ALERTS_HELP_READINESS_LABELS.routingDestinations}
        value={readiness.routingDestinationsLabel}
      />
      <ReadinessMetric
        label={ALERTS_HELP_READINESS_LABELS.lastEvaluation}
        value={readiness.lastEvaluationLabel}
      />
      {readiness.loadFailed ? (
        <p className={cn("m-0 sm:col-span-2 xl:col-span-4", OPERATOR_TYPOGRAPHY.helper)}>
          Workspace alert status could not be loaded. Open the alerts inbox to refresh live data.
        </p>
      ) : null}
    </section>
  );
}
