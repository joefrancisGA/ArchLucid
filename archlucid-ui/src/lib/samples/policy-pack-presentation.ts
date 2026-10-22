import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import type { SampleScenarioDefinition } from "@/lib/samples/types";

/** Buyer-facing policy pack label for a registered sample scenario. */
export function sampleScenarioPolicyPackLabel(scenario: SampleScenarioDefinition): string {
  return policyPackBuyerLabel(scenario.ruleSetId, scenario.ruleSetVersion);
}
