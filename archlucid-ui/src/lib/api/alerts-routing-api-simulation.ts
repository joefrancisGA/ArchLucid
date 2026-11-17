import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { RuleCandidateComparisonResult, RuleSimulationResult } from "@/types/alert-simulation";
import type { ThresholdRecommendationResult } from "@/types/alert-tuning";
import { trimOptionalText, trimTextFields } from "./api-boundary-normalization";
import { apiPostJson } from "./http";

/** POST `/${ApiV1Routes.alertSimulation}/simulate`: preview firing against recent architecture reviews. */
export type SimulateAlertRuleRequestBody = {
  ruleKind: string;
  simpleRule?: Record<string, unknown> | null;
  compositeRule?: Record<string, unknown> | null;
  runId?: string | null;
  comparedToRunId?: string | null;
  recentRunCount?: number;
  useHistoricalWindow?: boolean;
  runProjectSlug?: string;
};

function clampOptionalPositiveRunCount(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  const floored = Math.floor(value);

  return floored >= 1 ? floored : undefined;
}

function normalizeSimulateAlertRuleBody(body: SimulateAlertRuleRequestBody): SimulateAlertRuleRequestBody {
  const trimmed = trimTextFields(body, ["ruleKind", "runId", "comparedToRunId", "runProjectSlug"]);

  return {
    ...trimmed,
    runId: trimOptionalText(trimmed.runId ?? undefined) ?? null,
    comparedToRunId: trimOptionalText(trimmed.comparedToRunId ?? undefined) ?? null,
    runProjectSlug: trimOptionalText(trimmed.runProjectSlug),
    recentRunCount: clampOptionalPositiveRunCount(trimmed.recentRunCount),
  };
}

/** Simulates an alert rule against recent runs to preview what alerts would fire. */
export async function simulateAlertRule(body: SimulateAlertRuleRequestBody): Promise<RuleSimulationResult> {
  return apiPostJson<RuleSimulationResult>(
    `/${ApiV1Routes.alertSimulation}/simulate`,
    normalizeSimulateAlertRuleBody(body),
  );
}

export async function recommendAlertThreshold(body: {
  ruleKind: string;
  tunedMetricType: string;
  candidateThresholds: number[];
  recentRunCount?: number;
  targetCreatedAlertCountMin?: number;
  targetCreatedAlertCountMax?: number;
  runProjectSlug?: string;
  baseSimpleRule?: Record<string, unknown> | null;
  baseCompositeRule?: Record<string, unknown> | null;
}): Promise<ThresholdRecommendationResult> {
  const trimmed = trimTextFields(body, ["ruleKind", "tunedMetricType", "runProjectSlug"]);

  return apiPostJson<ThresholdRecommendationResult>("/v1/alert-tuning/recommend-threshold", {
    ...trimmed,
    recentRunCount: clampOptionalPositiveRunCount(trimmed.recentRunCount),
  });
}

/** Compares two alert rule candidates side-by-side using simulation. */
export async function compareAlertRuleCandidates(body: {
  ruleKind: string;
  candidateA_SimpleRule?: Record<string, unknown> | null;
  candidateB_SimpleRule?: Record<string, unknown> | null;
  candidateA_CompositeRule?: Record<string, unknown> | null;
  candidateB_CompositeRule?: Record<string, unknown> | null;
  recentRunCount?: number;
  runProjectSlug?: string;
}): Promise<RuleCandidateComparisonResult> {
  const trimmed = trimTextFields(body, ["ruleKind", "runProjectSlug"]);

  return apiPostJson<RuleCandidateComparisonResult>(
    `/${ApiV1Routes.alertSimulation}/compare-candidates`,
    {
      ...trimmed,
      recentRunCount: clampOptionalPositiveRunCount(trimmed.recentRunCount),
    },
  );
}
