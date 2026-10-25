import { describe, expect, it } from "vitest";

import {
  collectPolicyReferencesForCloudMismatchCheck,
  evaluatePolicyPackCloudMismatchForReview,
  normalizeCloudProviderForMismatchCheck,
} from "./policy-pack-cloud-mismatch-for-review";

describe("policy-pack-cloud-mismatch-for-review (TB-2322)", () => {
  it("normalizes authority CloudProvider enum values", () => {
    expect(normalizeCloudProviderForMismatchCheck("Aws")).toBe("aws");
    expect(normalizeCloudProviderForMismatchCheck("Gcp")).toBe("gcp");
    expect(normalizeCloudProviderForMismatchCheck("Azure")).toBe("azure");
    expect(normalizeCloudProviderForMismatchCheck("None")).toBe("none");
    expect(normalizeCloudProviderForMismatchCheck(undefined)).toBeNull();
    expect(normalizeCloudProviderForMismatchCheck(null)).toBeNull();
  });

  it("collects rule set, request refs, and pack-at-commit assignments", () => {
    const refs = collectPolicyReferencesForCloudMismatchCheck(
      "cis-azure",
      "2.0",
      ["soc2-architecture-themes"],
      [{ policyPackId: "azure-security", policyPackVersion: "1", scopeLevel: "tenant" }],
    );

    expect(refs).toEqual(
      expect.arrayContaining(["cis-azure", "cis-azure@2.0", "soc2-architecture-themes", "azure-security"]),
    );
  });

  it("does not call cloud-neutral when cloud target was omitted", () => {
    const mismatch = evaluatePolicyPackCloudMismatchForReview(
      null,
      "cis-azure",
      "2.0",
      [],
      [{ policyPackId: "cis-azure", policyPackVersion: "2.0", scopeLevel: "tenant" }],
    );

    expect(mismatch).toBe("Cloud target was not stored.");
  });

  it("flags Azure packs when cloud target is AWS on committed review", () => {
    const mismatch = evaluatePolicyPackCloudMismatchForReview(
      "Aws",
      "cis-azure",
      "2.0",
      [],
      [{ policyPackId: "cis-azure", policyPackVersion: "2.0", scopeLevel: "tenant" }],
    );

    expect(mismatch).toContain("Azure-focused policy packs");
    expect(mismatch).toContain("AWS");
  });
});
