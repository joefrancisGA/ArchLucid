import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildArchitectureGovernanceFinalizeReadinessHref } from "@/lib/architecture/architecture-created-finalize-readiness-href";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture/architecture-workspace-tabs";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { applyFindingsConfidenceVisibility } from "@/lib/findings/finding-confidence-filter";
import { isReviewFindingDispositionClosed } from "@/lib/findings/finding-job-view";
import {
  sortQuickDecisionFindings,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

export type ArchitectureCreatedFindingsNextActionProps = {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  readonly analysisStagesComplete: boolean;
  readonly onNavigateActivity?: () => void;
};

function triageVisibleFindings(
  findings: readonly QuickDecisionFinding[],
): readonly QuickDecisionFinding[] {
  const nonMuted = findings.filter(
    (finding) => !finding.isMuted && !isReviewFindingDispositionClosed(finding),
  );
  const { visibleFindings } = applyFindingsConfidenceVisibility(nonMuted, false);

  return visibleFindings;
}

/** Findings-scoped primary action for create-home Findings tab (REF). */
export function ArchitectureCreatedFindingsNextAction(
  props: ArchitectureCreatedFindingsNextActionProps,
): React.JSX.Element | null {
  const sortedFindings = sortQuickDecisionFindings(triageVisibleFindings(props.findings));
  const highestSeverityFinding = sortedFindings[0] ?? null;
  const activityHref = buildArchitectureWorkspaceTabHref(props.runId, "activity", {
    includeCreateIntent: true,
  });

  if (highestSeverityFinding !== null) {
    const href = `/architecture/reviews/${encodeURIComponent(props.runId)}/findings/${encodeURIComponent(highestSeverityFinding.findingId)}`;

    return (
      <div
        className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
        data-testid="architecture-findings-next-action"
      >
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Recommended next step
        </p>
        <Button type="button" variant="primary" size="sm" className="mt-2 h-8" asChild>
          <Link href={href} prefetch={false} data-testid="architecture-findings-triage-primary-action">
            Triage highest-severity finding
          </Link>
        </Button>
      </div>
    );
  }

  if (props.analysisStagesComplete) {
    return (
      <div
        className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
        data-testid="architecture-findings-next-action"
      >
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Recommended next step
        </p>
        <Button type="button" variant="primary" size="sm" className="mt-2 h-8" asChild>
          <Link
            href={buildArchitectureGovernanceFinalizeReadinessHref(props.runId)}
            prefetch={false}
            data-testid="architecture-findings-finalize-primary-action"
          >
            Review finalize readiness
          </Link>
        </Button>
      </div>
    );
  }

  if (props.onNavigateActivity !== undefined) {
    return (
      <div
        className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
        data-testid="architecture-findings-next-action"
      >
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Recommended next step
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="mt-2 h-8"
          data-testid="architecture-findings-activity-primary-action"
          onClick={props.onNavigateActivity}
        >
          View assessment progress
        </Button>
      </div>
    );
  }

  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="architecture-findings-next-action"
    >
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Recommended next step
      </p>
      <Button type="button" variant="primary" size="sm" className="mt-2 h-8" asChild>
        <Link href={activityHref} prefetch={false} data-testid="architecture-findings-activity-primary-action">
          View assessment progress
        </Link>
      </Button>
    </div>
  );
}
