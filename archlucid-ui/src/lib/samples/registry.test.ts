import { describe, expect, it } from "vitest";

import {
  CLAIMS_INTAKE_SAMPLE_DEFINITION,
  CLAIMS_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/claims-intake/definition";
import {
  CUSTOMER_INTAKE_SAMPLE_DEFINITION,
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/customer-intake-modernization/definition";
import {
  ACTIVE_SAMPLE_SCENARIO_SLUG,
  getActiveSampleScenario,
  isActiveSampleHeroFindingId,
  isActiveSamplePolicyPackId,
  isActiveSampleRunId,
  isSampleHeroFindingIdForRun,
  listRegisteredSampleScenarios,
  resolveSampleScenarioByRunId,
  resolveSampleScenarioBySlug,
} from "@/lib/samples/registry";

describe("samples/registry", () => {
  it("exposes claims-intake as the active default scenario", () => {
    expect(ACTIVE_SAMPLE_SCENARIO_SLUG).toBe("claims-intake");
    expect(getActiveSampleScenario()).toBe(CLAIMS_INTAKE_SAMPLE_DEFINITION);
    expect(resolveSampleScenarioBySlug("claims-intake")).toBe(CLAIMS_INTAKE_SAMPLE_DEFINITION);
  });

  it("registers customer-intake as a secondary scenario without flipping the default", () => {
    expect(listRegisteredSampleScenarios()).toHaveLength(2);
    expect(resolveSampleScenarioBySlug("customer-intake")).toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION);
    expect(resolveSampleScenarioByRunId(CUSTOMER_INTAKE_SAMPLE_RUN_ID)).toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION);
    expect(getActiveSampleScenario()).not.toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION);
  });

  it("resolves hero finding and run ids from the definition package", () => {
    expect(isActiveSampleRunId(CLAIMS_INTAKE_SAMPLE_RUN_ID)).toBe(true);
    expect(isActiveSampleRunId(CUSTOMER_INTAKE_SAMPLE_RUN_ID)).toBe(true);
    expect(isActiveSampleHeroFindingId(CLAIMS_INTAKE_SAMPLE_DEFINITION.primaryFindingId)).toBe(true);
    expect(isActiveSampleHeroFindingId(`${CLAIMS_INTAKE_SAMPLE_DEFINITION.primaryFindingId}-alt`)).toBe(true);
    expect(
      isSampleHeroFindingIdForRun(
        CUSTOMER_INTAKE_SAMPLE_RUN_ID,
        CUSTOMER_INTAKE_SAMPLE_DEFINITION.primaryFindingId,
      ),
    ).toBe(true);
  });

  it("matches healthcare claims policy pack aliases from the definition", () => {
    expect(isActiveSamplePolicyPackId("demo-healthcare-claims-pack")).toBe(true);
    expect(isActiveSamplePolicyPackId("healthcare-claims-v3")).toBe(true);
    expect(isActiveSamplePolicyPackId("responsible-ai-v1")).toBe(false);
  });
});
