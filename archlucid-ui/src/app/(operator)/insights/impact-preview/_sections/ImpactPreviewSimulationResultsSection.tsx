"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { SimulationRunDiffCard } from "@/components/evolution/SimulationRunDiffCard";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import {
  IMPACT_PREVIEW_AFTER_LABEL,
  IMPACT_PREVIEW_BEFORE_AFTER_TITLE,
  IMPACT_PREVIEW_BEFORE_LABEL,
  IMPACT_PREVIEW_EXPECTED_CHANGE_LABEL,
} from "@/lib/impact-preview-page-copy";
import type { ImpactPreviewComparisonScope } from "@/lib/impact-preview-page-types";
import type { EvolutionPlanSnapshot } from "@/lib/evolution-plan-snapshot";
import { planningPlanDetailPath } from "@/lib/planning-route";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EvolutionResultsResponse } from "@/types/evolution";

export type ImpactPreviewSimulationResultsSectionProps = {
  readonly detail: EvolutionResultsResponse;
  readonly detailLoading: boolean;
  readonly planSnapshot: EvolutionPlanSnapshot | null;
  readonly selectedBaselineId: string | null;
  readonly comparisonScope: ImpactPreviewComparisonScope;
};

export function ImpactPreviewSimulationResultsSection(
  props: ImpactPreviewSimulationResultsSectionProps,
): React.JSX.Element {
  const runs = (props.detail.simulationRuns ?? []).filter((run) => {
    if (props.selectedBaselineId === null) {
      return true;
    }

    return run.baselineArchitectureRunId === props.selectedBaselineId;
  });

  return (
    <section className="space-y-4" aria-labelledby="impact-preview-results-heading" data-testid="impact-preview-results-section">
      <div>
        <h2 id="impact-preview-results-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {IMPACT_PREVIEW_BEFORE_AFTER_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {IMPACT_PREVIEW_EXPECTED_CHANGE_LABEL}: compare <strong>{IMPACT_PREVIEW_BEFORE_LABEL}</strong> against{" "}
          <strong>{IMPACT_PREVIEW_AFTER_LABEL}</strong> for the selected baseline review.
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
        <p className={cn("m-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <strong>{props.detail.candidate.title}</strong>
        </p>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{props.detail.candidate.summary}</p>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Source plan{" "}
          <Link
            href={planningPlanDetailPath(props.detail.candidate.sourcePlanId)}
            className={OPERATOR_LINK.inline}
          >
            {props.detail.candidate.sourcePlanId}
          </Link>
        </p>
      </div>

      {props.comparisonScope.cost && props.planSnapshot !== null ? (
        <div
          className={cn(
            "rounded-md border border-neutral-200 bg-al-surface-raised px-3.5 py-3 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          <p className="mb-2">
            <strong>Estimated priority score:</strong> {props.planSnapshot.priorityScore}
          </p>
          <p className="mb-2">
            <strong>Action steps:</strong> {props.planSnapshot.actionStepCount}
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.planSnapshot.summary}</p>
        </div>
      ) : null}

      {props.detailLoading ? (
        <OperatorLoadingNotice>
          <strong>Updating simulation results.</strong>
        </OperatorLoadingNotice>
      ) : null}

      {runs.length === 0 ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          No saved simulations for this baseline yet. Select a proposed change and run <strong>Simulate impact</strong>.
        </p>
      ) : (
        runs.map((run) => (
          <SimulationRunDiffCard key={run.simulationRunId} run={run} planLinkedRunIds={props.planSnapshot?.linkedArchitectureRunIds ?? []} />
        ))
      )}
    </section>
  );
}
