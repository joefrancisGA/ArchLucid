import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance-route-paths";
import {
  POLICY_PACKS_STANDARDS_COMPACT_LINE,
  POLICY_PACKS_STANDARDS_HEADING,
  POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK,
  POLICY_PACKS_STANDARDS_STANDARDS_LINK,
  POLICY_PACKS_STANDARDS_WHY_TWO,
  buildPolicyPacksStandardsVocabulary,
  resolvePolicyPacksStandardsPeerLink,
} from "@/lib/vocabulary/policy-packs-standards-vocabulary";

describe("policy-packs-standards-vocabulary (TB-2239)", () => {
  it("explains why policy packs and standards stay separate and deep-links both", () => {
    const model = buildPolicyPacksStandardsVocabulary();

    expect(model.heading).toBe(POLICY_PACKS_STANDARDS_HEADING);
    expect(model.whyTwo).toBe(POLICY_PACKS_STANDARDS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("policy pack");
    expect(model.whyTwo.toLowerCase()).toContain("standards");
    expect(model.whyTwo.toLowerCase()).toContain("effective");
    expect(model.compactLine).toBe(POLICY_PACKS_STANDARDS_COMPACT_LINE);

    expect(model.policyPacksLink).toEqual(POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK);
    expect(model.policyPacksLink.href).toBe(GOVERNANCE_POLICY_PACKS_PATH);
    expect(model.policyPacksLink.href).toBe("/governance/policy-packs");

    expect(model.standardsLink).toEqual(POLICY_PACKS_STANDARDS_STANDARDS_LINK);
    expect(model.standardsLink.href).toBe(GOVERNANCE_STANDARDS_AND_RULES_PATH);
    expect(model.standardsLink.href).toBe("/governance/standards-and-rules");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolvePolicyPacksStandardsPeerLink("policy-packs")).toEqual(
      POLICY_PACKS_STANDARDS_STANDARDS_LINK,
    );
    expect(resolvePolicyPacksStandardsPeerLink("standards-and-rules")).toEqual(
      POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK,
    );
  });
});
