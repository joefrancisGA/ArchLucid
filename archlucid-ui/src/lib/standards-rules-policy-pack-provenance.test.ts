import { describe, expect, it } from "vitest";

import {
  isFocusedPilotBundledPolicyPackId,
  resolveBundledPolicyPackProvenanceLabel,
  STANDARDS_RULES_PLATFORM_DEFAULT_PROVENANCE_LABEL,
} from "./standards-rules-policy-pack-provenance";

describe("standards-rules-policy-pack-provenance", () => {
  it("recognizes focused-pilot bundled pack ids", () => {
    expect(isFocusedPilotBundledPolicyPackId("security-architecture-baseline")).toBe(true);
    expect(isFocusedPilotBundledPolicyPackId("tenant-custom-pack")).toBe(false);
  });

  it("returns platform default provenance for bundled pack ids", () => {
    expect(resolveBundledPolicyPackProvenanceLabel("cost-optimization")).toBe(
      STANDARDS_RULES_PLATFORM_DEFAULT_PROVENANCE_LABEL,
    );
    expect(resolveBundledPolicyPackProvenanceLabel("tenant-custom-pack")).toBeNull();
  });
});
