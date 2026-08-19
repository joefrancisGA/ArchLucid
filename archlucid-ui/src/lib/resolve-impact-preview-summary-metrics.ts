import {
  IMPACT_PREVIEW_BASED_ON_EVIDENCE_LABEL,
} from "@/lib/impact-preview-page-copy";
import type { ImpactPreviewSummaryMetrics } from "@/lib/impact-preview-page-types";
import type { EvolutionPlanSnapshot } from "@/lib/evolution-plan-snapshot";
import { parseEvolutionOutcomeJson } from "@/lib/evolution-outcome";
import type { EvolutionSimulationRunWithEvaluationResponse } from "@/types/evolution";

import { resolveImpactPreviewRecommendation } from "./resolve-impact-preview-recommendation";

const NOT_AVAILABLE = "Not available" as const;

/** Builds summary card labels from the latest matching simulation run. */
export function resolveImpactPreviewSummaryMetrics(
  simulationRun: EvolutionSimulationRunWithEvaluationResponse | null,
  planSnapshot: EvolutionPlanSnapshot | null,
): ImpactPreviewSummaryMetrics {
  const evaluation = simulationRun?.evaluationScore ?? null;
  const parsedOutcome =
    simulationRun !== null ? parseEvolutionOutcomeJson(simulationRun.outcomeJson) : { kind: "empty" as const };
  const warningCount =
    parsedOutcome.kind === "v2" || parsedOutcome.kind === "legacy" ? parsedOutcome.shadow.warningCount : null;
  const regressionSignals = evaluation?.regressionSignals ?? [];

  const findingsChangedLabel =
    warningCount !== null
      ? `${warningCount} analysis warning${warningCount === 1 ? "" : "s"} in estimated outcome`
      : NOT_AVAILABLE;

  const risksReducedLabel =
    evaluation?.improvementDelta !== null && evaluation?.improvementDelta !== undefined && evaluation.improvementDelta > 0
      ? `Estimated improvement delta ${evaluation.improvementDelta.toFixed(2)}`
      : "No estimated risk reduction yet";

  const risksIntroducedLabel =
    regressionSignals.length > 0
      ? `${regressionSignals.length} regression signal${regressionSignals.length === 1 ? "" : "s"}`
      : "None detected";

  const costImpactLabel =
    planSnapshot !== null
      ? `Priority score ${planSnapshot.priorityScore.toFixed(1)} · ${planSnapshot.actionStepCount} action step${planSnapshot.actionStepCount === 1 ? "" : "s"}`
      : NOT_AVAILABLE;

  const governanceStatusLabel = resolveImpactPreviewRecommendation(evaluation);

  return {
    findingsChangedLabel: `${findingsChangedLabel} · ${IMPACT_PREVIEW_BASED_ON_EVIDENCE_LABEL}`,
    risksReducedLabel,
    risksIntroducedLabel,
    costImpactLabel,
    governanceStatusLabel,
  };
}
