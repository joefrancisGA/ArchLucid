import {
  AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION,
} from "@/lib/samples/ai-knowledge-assistant/definition";
import {
  CLAIMS_INTAKE_SAMPLE_DEFINITION,
} from "@/lib/samples/claims-intake/definition";
import { CUSTOMER_INTAKE_SAMPLE_DEFINITION } from "@/lib/samples/customer-intake-modernization/definition";
import type { SampleScenarioDefinition } from "@/lib/samples/types";

/** Active default sample scenario for marketing, static showcase, and operator demo spine. */
export const ACTIVE_SAMPLE_SCENARIO_SLUG = CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug;

const REGISTERED_SAMPLE_SCENARIOS: readonly SampleScenarioDefinition[] = [
  AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION,
  CLAIMS_INTAKE_SAMPLE_DEFINITION,
  CUSTOMER_INTAKE_SAMPLE_DEFINITION,
];

const SAMPLE_SCENARIO_BY_SLUG: Readonly<Record<string, SampleScenarioDefinition>> = Object.fromEntries(
  REGISTERED_SAMPLE_SCENARIOS.map((scenario) => [scenario.slug, scenario]),
);

const SAMPLE_SCENARIO_BY_RUN_ID: Readonly<Record<string, SampleScenarioDefinition>> = (() => {
  const entries: Array<[string, SampleScenarioDefinition]> = [];

  for (const scenario of REGISTERED_SAMPLE_SCENARIOS) {
    entries.push([scenario.runId, scenario]);
    entries.push([scenario.priorCompareRunId, scenario]);
    entries.push([scenario.laterCompareRunId, scenario]);
  }

  return Object.fromEntries(entries);
})();

const SAMPLE_SCENARIO_BY_MANIFEST_ID: Readonly<Record<string, SampleScenarioDefinition>> = Object.fromEntries(
  REGISTERED_SAMPLE_SCENARIOS.map((scenario) => [scenario.manifestId, scenario]),
);

const SAMPLE_SCENARIO_BY_POLICY_PACK_TOKEN: Readonly<Record<string, SampleScenarioDefinition>> = (() => {
  const entries: Array<[string, SampleScenarioDefinition]> = [];

  for (const scenario of REGISTERED_SAMPLE_SCENARIOS) {
    entries.push([scenario.ruleSetId.trim().toLowerCase(), scenario]);

    for (const alias of scenario.policyPackIdAliases) {
      entries.push([alias.trim().toLowerCase(), scenario]);
    }
  }

  return Object.fromEntries(entries);
})();

const SAMPLE_SCENARIO_BY_HERO_FINDING_ID: Readonly<Record<string, SampleScenarioDefinition>> = Object.fromEntries(
  REGISTERED_SAMPLE_SCENARIOS.map((scenario) => [scenario.primaryFindingId.toLowerCase(), scenario]),
);

const SAMPLE_SCENARIO_RUN_IDS: ReadonlySet<string> = new Set(Object.keys(SAMPLE_SCENARIO_BY_RUN_ID));

export function getActiveSampleScenario(): SampleScenarioDefinition {
  return CUSTOMER_INTAKE_SAMPLE_DEFINITION;
}

export function listRegisteredSampleScenarios(): readonly SampleScenarioDefinition[] {
  return REGISTERED_SAMPLE_SCENARIOS;
}

export function resolveSampleScenarioBySlug(slug: string): SampleScenarioDefinition | null {
  const normalized = slug.trim().toLowerCase();

  return SAMPLE_SCENARIO_BY_SLUG[normalized] ?? null;
}

export function resolveSampleScenarioByRunId(runId: string | null | undefined): SampleScenarioDefinition | null {
  const normalized = (runId ?? "").trim().toLowerCase();

  if (normalized.length === 0) {
    return null;
  }

  return SAMPLE_SCENARIO_BY_RUN_ID[normalized] ?? null;
}

export function resolveSampleScenarioByManifestId(manifestId: string | null | undefined): SampleScenarioDefinition | null {
  const normalized = (manifestId ?? "").trim().toLowerCase();

  if (normalized.length === 0) {
    return null;
  }

  return SAMPLE_SCENARIO_BY_MANIFEST_ID[normalized] ?? null;
}

function normalizeSampleLookupToken(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function resolveSampleScenarioByPolicyPackId(
  policyPackId: string | null | undefined,
): SampleScenarioDefinition | null {
  const normalized = normalizeSampleLookupToken(policyPackId);

  if (normalized.length === 0) {
    return null;
  }

  const exact = SAMPLE_SCENARIO_BY_POLICY_PACK_TOKEN[normalized];

  if (exact !== undefined) {
    return exact;
  }

  for (const scenario of REGISTERED_SAMPLE_SCENARIOS) {
    const matchesAlias = scenario.policyPackIdAliases.some(
      (alias) => normalized === alias || normalized.includes(alias),
    );

    if (matchesAlias) {
      return scenario;
    }
  }

  return null;
}

export function resolveSampleScenarioByHeroFindingId(
  findingId: string | null | undefined,
): SampleScenarioDefinition | null {
  const normalized = normalizeSampleLookupToken(findingId);

  if (normalized.length === 0) {
    return null;
  }

  const exact = SAMPLE_SCENARIO_BY_HERO_FINDING_ID[normalized];

  if (exact !== undefined) {
    return exact;
  }

  for (const scenario of REGISTERED_SAMPLE_SCENARIOS) {
    const heroId = scenario.primaryFindingId.toLowerCase();

    if (normalized.startsWith(`${heroId}-`)) {
      return scenario;
    }
  }

  return null;
}

export function isSampleHeroFindingReferenceId(findingId: string | null | undefined): boolean {
  return resolveSampleScenarioByHeroFindingId(findingId) !== null;
}

export function isSamplePolicyPackId(policyPackId: string | null | undefined): boolean {
  return resolveSampleScenarioByPolicyPackId(policyPackId) !== null;
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

export function isSampleHeroFindingIdForRun(
  runId: string | null | undefined,
  findingId: string | null | undefined,
): boolean {
  const scenario = resolveSampleScenarioByRunId(runId);

  if (scenario === null) {
    return false;
  }

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

export function isSampleHeroFindingLabel(label: string | null | undefined): boolean {
  const normalized = normalizeSampleLookupToken(label);

  if (normalized.length === 0) {
    return false;
  }

  for (const scenario of REGISTERED_SAMPLE_SCENARIOS) {
    const heroTitle = scenario.primaryFindingTitle.toLowerCase();

    if (normalized === heroTitle || normalized.includes(heroTitle)) {
      return true;
    }

    if (sampleCategoryTokenMatches(normalized, scenario)) {
      return true;
    }
  }

  return false;
}

export function activeSampleRunIdSet(): ReadonlySet<string> {
  return SAMPLE_SCENARIO_RUN_IDS;
}
