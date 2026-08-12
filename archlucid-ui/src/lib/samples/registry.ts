import {
  CLAIMS_INTAKE_SAMPLE_DEFINITION,
  CLAIMS_INTAKE_PRIOR_COMPARE_RUN_ID,
  CLAIMS_INTAKE_LATER_COMPARE_RUN_ID,
  CLAIMS_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/claims-intake/definition";
import type { SampleScenarioDefinition } from "@/lib/samples/types";

/** Active default sample scenario for marketing, static showcase, and operator demo spine. */
export const ACTIVE_SAMPLE_SCENARIO_SLUG = CLAIMS_INTAKE_SAMPLE_DEFINITION.slug;

const SAMPLE_SCENARIO_BY_SLUG: Readonly<Record<string, SampleScenarioDefinition>> = {
  [CLAIMS_INTAKE_SAMPLE_DEFINITION.slug]: CLAIMS_INTAKE_SAMPLE_DEFINITION,
};

const SAMPLE_SCENARIO_RUN_IDS: ReadonlySet<string> = new Set([
  CLAIMS_INTAKE_SAMPLE_RUN_ID,
  CLAIMS_INTAKE_PRIOR_COMPARE_RUN_ID,
  CLAIMS_INTAKE_LATER_COMPARE_RUN_ID,
]);

export function getActiveSampleScenario(): SampleScenarioDefinition {
  return CLAIMS_INTAKE_SAMPLE_DEFINITION;
}

export function resolveSampleScenarioBySlug(slug: string): SampleScenarioDefinition | null {
  const normalized = slug.trim().toLowerCase();

  return SAMPLE_SCENARIO_BY_SLUG[normalized] ?? null;
}

export function isActiveSampleRunId(runId: string | null | undefined): boolean {
  const normalized = (runId ?? "").trim().toLowerCase();

  return SAMPLE_SCENARIO_RUN_IDS.has(normalized);
}

export function isActiveSampleHeroFindingId(findingId: string | null | undefined): boolean {
  const scenario = getActiveSampleScenario();
  const normalized = (findingId ?? "").trim().toLowerCase();
  const heroId = scenario.primaryFindingId.toLowerCase();

  return normalized === heroId || normalized.startsWith(`${heroId}-`);
}

export function sampleCategoryTokenMatches(value: string, scenario: SampleScenarioDefinition = getActiveSampleScenario()): boolean {
  const haystack = value.trim().toLowerCase();

  if (haystack.length === 0) {
    return false;
  }

  return scenario.categoryTokens.some((token) => haystack.includes(token.trim().toLowerCase()));
}

export function isActiveSamplePolicyPackId(policyPackId: string): boolean {
  const scenario = getActiveSampleScenario();
  const normalized = policyPackId.trim().toLowerCase();

  return scenario.policyPackIdAliases.some((alias) => normalized === alias || normalized.includes(alias));
}

export function activeSampleRunIdSet(): ReadonlySet<string> {
  return SAMPLE_SCENARIO_RUN_IDS;
}
