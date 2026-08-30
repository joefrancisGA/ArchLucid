import { describe, expect, it } from "vitest";

import {
  governanceAllowedTargetSlugs,
  governanceEnvironmentOptionsFromCatalog,
  isGovernanceEnvironmentTransitionAllowed,
} from "@/lib/governance/governance-environment-catalog-helpers";
import type { GovernanceEnvironmentCatalog } from "@/types/governance-environment-catalog";

const sampleCatalog: GovernanceEnvironmentCatalog = {
  environments: [
    { slug: "dev", displayName: "Development", sortOrder: 0, isActive: true },
    { slug: "test", displayName: "Staging", sortOrder: 1, isActive: true },
    { slug: "retired", displayName: "Retired", sortOrder: 2, isActive: false },
  ],
  transitions: [
    { sourceSlug: "dev", targetSlug: "test" },
  ],
};

describe("governance-environment-catalog-helpers", () => {
  it("maps active environments to select options", () => {
    expect(governanceEnvironmentOptionsFromCatalog(sampleCatalog)).toEqual([
      { value: "dev", label: "Development" },
      { value: "test", label: "Staging" },
    ]);
  });

  it("returns allowed target slugs for a source environment", () => {
    expect(governanceAllowedTargetSlugs(sampleCatalog, "dev")).toEqual(["test"]);
    expect(governanceAllowedTargetSlugs(sampleCatalog, "test")).toEqual([]);
  });

  it("detects whether a transition is allowed", () => {
    expect(isGovernanceEnvironmentTransitionAllowed(sampleCatalog, "dev", "test")).toBe(true);
    expect(isGovernanceEnvironmentTransitionAllowed(sampleCatalog, "test", "dev")).toBe(false);
  });
});
