import { describe, expect, it } from "vitest";

import {
  isStandardBaselinePolicyPackName,
  STANDARD_BASELINE_POLICY_PACK_DISPLAY_NAMES,
} from "@/lib/policy/policy-pack-standard-baseline";

describe("policy-pack-standard-baseline", () => {
  it("recognizes tri-cloud WAF and CIS baseline pack display names", () => {
    expect(isStandardBaselinePolicyPackName("Azure Well-Architected Framework")).toBe(true);
    expect(isStandardBaselinePolicyPackName("AWS Well-Architected Framework")).toBe(true);
    expect(isStandardBaselinePolicyPackName("Google Cloud Architecture Framework")).toBe(true);
    expect(isStandardBaselinePolicyPackName("CIS Microsoft Azure Foundations Benchmark")).toBe(true);
    expect(isStandardBaselinePolicyPackName("CIS AWS Foundations Benchmark")).toBe(true);
    expect(isStandardBaselinePolicyPackName("CIS Google Cloud Platform Foundation Benchmark")).toBe(true);
  });

  it("rejects custom tenant pack names", () => {
    expect(isStandardBaselinePolicyPackName("Custom Security Pack")).toBe(false);
  });

  it("keeps the baseline set aligned with bundled default packs", () => {
    expect(STANDARD_BASELINE_POLICY_PACK_DISPLAY_NAMES.size).toBeGreaterThanOrEqual(18);
  });
});
