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
  it("exposes customer-intake as the active default scenario (TB-981)", () => {
    expect(ACTIVE_SAMPLE_SCENARIO_SLUG).toBe("customer-intake");
    expect(getActiveSampleScenario()).toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION);
    expect(resolveSampleScenarioBySlug("customer-intake")).toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION);
  });

  it("keeps claims-intake registered as the regulated-depth secondary scenario", () => {
    expect(listRegisteredSampleScenarios()).toHaveLength(2);
    expect(resolveSampleScenarioBySlug("claims-intake")).toBe(CLAIMS_INTAKE_SAMPLE_DEFINITION);
    expect(resolveSampleScenarioByRunId(CLAIMS_INTAKE_SAMPLE_RUN_ID)).toBe(CLAIMS_INTAKE_SAMPLE_DEFINITION);
    expect(getActiveSampleScenario()).not.toBe(CLAIMS_INTAKE_SAMPLE_DEFINITION);
  });

  it("resolves hero finding and run ids from the definition package", () => {
    expect(isActiveSampleRunId(CLAIMS_INTAKE_SAMPLE_RUN_ID)).toBe(true);
    expect(isActiveSampleRunId(CUSTOMER_INTAKE_SAMPLE_RUN_ID)).toBe(true);
    expect(isActiveSampleHeroFindingId(CUSTOMER_INTAKE_SAMPLE_DEFINITION.primaryFindingId)).toBe(true);
    expect(isActiveSampleHeroFindingId(`${CUSTOMER_INTAKE_SAMPLE_DEFINITION.primaryFindingId}-alt`)).toBe(true);
    expect(
      isSampleHeroFindingIdForRun(
        CLAIMS_INTAKE_SAMPLE_RUN_ID,
        CLAIMS_INTAKE_SAMPLE_DEFINITION.primaryFindingId,
      ),
    ).toBe(true);
  });

  it("matches enterprise privacy policy pack aliases from the active definition", () => {
    expect(isActiveSamplePolicyPackId("demo-enterprise-privacy-pack")).toBe(true);
    expect(isActiveSamplePolicyPackId("enterprise-privacy-v2")).toBe(true);
    expect(isActiveSamplePolicyPackId("demo-enterprise-privacy-pack")).toBe(false);
  });
});
