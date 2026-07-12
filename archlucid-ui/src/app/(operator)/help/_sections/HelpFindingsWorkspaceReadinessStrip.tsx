"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FINDINGS_HELP_READINESS_LABELS,
  useFindingsHelpWorkspaceReadiness,
} from "@/lib/use-findings-help-workspace-readiness";

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

/** Compact workspace finding summary for `/help/findings` — live API data only. */
export function HelpFindingsWorkspaceReadinessStrip(): React.ReactElement {
  const readiness = useFindingsHelpWorkspaceReadiness();

  return (
    <section
      aria-label="Workspace finding summary"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="help-findings-workspace-readiness"
    >
      <ReadinessMetric
        label={FINDINGS_HELP_READINESS_LABELS.openFindings}
        value={readiness.openFindingsLabel}
      />
      <ReadinessMetric
        label={FINDINGS_HELP_READINESS_LABELS.criticalAndHigh}
        value={readiness.criticalAndHighLabel}
      />
      <ReadinessMetric
        label={FINDINGS_HELP_READINESS_LABELS.awaitingDecision}
        value={readiness.awaitingDecisionLabel}
      />
      <ReadinessMetric
        label={FINDINGS_HELP_READINESS_LABELS.recentlyResolved}
        value={readiness.recentlyResolvedLabel}
      />
      {readiness.loadFailed ? (
        <p className={cn("m-0 sm:col-span-2 xl:col-span-4", OPERATOR_TYPOGRAPHY.helper)}>
          Workspace finding status could not be loaded. Open findings to refresh live data.
        </p>
      ) : null}
    </section>
  );
}
