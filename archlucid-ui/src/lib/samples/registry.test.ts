import { describe, expect, it } from "vitest";

import {
  CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF,
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
  isSampleHeroFindingReferenceId,
  isSamplePolicyPackId,
  isSampleHeroFindingIdForRun,
  listRegisteredSampleScenarios,
  resolveSampleScenarioByHeroFindingId,
  resolveSampleScenarioByPolicyPackId,
  resolveSampleScenarioByRunId,
  resolveSampleScenarioBySlug,
} from "@/lib/samples/registry";

describe("samples/registry", () => {
  it("exposes customer-intake as the active default scenario (TB-981)", () => {
    expect(ACTIVE_SAMPLE_SCENARIO_SLUG).toBe("customer-intake");
    expect(getActiveSampleScenario()).toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION);
    expect(resolveSampleScenarioBySlug("customer-intake")).toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION);
  });

  it("registers three sample scenarios including AI Knowledge Assistant (TB-982)", () => {
    expect(listRegisteredSampleScenarios()).toHaveLength(3);
    expect(resolveSampleScenarioBySlug("ai-knowledge-assistant")).toBeDefined();
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
    expect(isActiveSamplePolicyPackId("healthcare-claims-v3")).toBe(false);
  });

  it("resolves policy pack and hero finding ids across registered scenarios", () => {
    expect(resolveSampleScenarioByPolicyPackId("healthcare-claims-v3")).toBe(CLAIMS_INTAKE_SAMPLE_DEFINITION);
    expect(resolveSampleScenarioByPolicyPackId("demo-healthcare-claims-pack")).toBe(CLAIMS_INTAKE_SAMPLE_DEFINITION);
    expect(resolveSampleScenarioByPolicyPackId("enterprise-privacy-v2")).toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION);
    expect(isSamplePolicyPackId("healthcare-claims-v3")).toBe(true);
    expect(resolveSampleScenarioByHeroFindingId(CLAIMS_INTAKE_SAMPLE_DEFINITION.primaryFindingId)).toBe(
      CLAIMS_INTAKE_SAMPLE_DEFINITION,
    );
    expect(isSampleHeroFindingReferenceId(CUSTOMER_INTAKE_SAMPLE_DEFINITION.primaryFindingId)).toBe(true);
    expect(resolveSampleScenarioByPolicyPackId("healthcare-claims-v3")?.policyPackDetailHref).toBe(
      CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF,
    );
  });
});
