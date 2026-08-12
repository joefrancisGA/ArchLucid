import { describe, expect, it } from "vitest";

import {
  PATTERN_LIBRARY_POLICY_PACKS_COMPACT_LINE,
  PATTERN_LIBRARY_POLICY_PACKS_HEADING,
  PATTERN_LIBRARY_POLICY_PACKS_LIBRARY_LINK,
  PATTERN_LIBRARY_POLICY_PACKS_PACKS_LINK,
  PATTERN_LIBRARY_POLICY_PACKS_WHY_TWO,
  buildPatternLibraryPolicyPacksVocabulary,
  resolvePatternLibraryPolicyPacksPeerLink,
} from "@/lib/vocabulary/pattern-library-policy-packs-vocabulary";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance-route-paths";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";

describe("pattern-library-policy-packs-vocabulary (TB-2292)", () => {
  it("explains pattern catalog vs enforceable policy packs", () => {
    const model = buildPatternLibraryPolicyPacksVocabulary();

    expect(model.heading).toBe(PATTERN_LIBRARY_POLICY_PACKS_HEADING);
    expect(model.heading.toLowerCase()).toContain("pattern library");
    expect(model.heading.toLowerCase()).toContain("policy packs");
    expect(model.whyTwo).toBe(PATTERN_LIBRARY_POLICY_PACKS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("catalog");
    expect(model.whyTwo.toLowerCase()).toContain("enforceable");
    expect(model.compactLine).toBe(PATTERN_LIBRARY_POLICY_PACKS_COMPACT_LINE);

    expect(model.patternLibraryLink).toEqual(PATTERN_LIBRARY_POLICY_PACKS_LIBRARY_LINK);
    expect(model.patternLibraryLink.href).toBe(PATTERN_LIBRARY_PATH);
    expect(model.patternLibraryLink.href).toBe("/insights/patterns");

    expect(model.policyPacksLink).toEqual(PATTERN_LIBRARY_POLICY_PACKS_PACKS_LINK);
    expect(model.policyPacksLink.href).toBe(GOVERNANCE_POLICY_PACKS_PATH);
    expect(model.policyPacksLink.href).toBe("/governance/policy-packs");
  });

  it("resolves the peer surface from pattern library and policy packs", () => {
    expect(resolvePatternLibraryPolicyPacksPeerLink("pattern-library")).toEqual(
      PATTERN_LIBRARY_POLICY_PACKS_PACKS_LINK,
    );

    expect(resolvePatternLibraryPolicyPacksPeerLink("policy-packs")).toEqual(
      PATTERN_LIBRARY_POLICY_PACKS_LIBRARY_LINK,
    );
  });
});
