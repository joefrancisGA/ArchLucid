import { describe, expect, it } from "vitest";

import {
  BASELINE_UX_SCOPED_COVERAGE_HONESTY,
  listHelpGovernanceBaselineCopyViolations,
} from "@/lib/help/help-governance-baseline-copy-guard";
import { REVIEW_SCOPE_HELP_EXPLANATION } from "@/lib/focused-pilot-mode-policy-packs";

describe("help-governance-baseline-copy guard (TB-2263)", () => {
  it("keeps canonical help/governance baseline copy free of false tri-cloud peer claims", () => {
    expect(listHelpGovernanceBaselineCopyViolations()).toEqual([]);
  });

  it("documents scoped baseline honesty aligned with TB-2249 badges", () => {
    expect(BASELINE_UX_SCOPED_COVERAGE_HONESTY).toContain("rule coverage by cloud");
    expect(REVIEW_SCOPE_HELP_EXPLANATION.toLowerCase()).not.toMatch(
      /provider-neutral quality baseline|identical coverage on every cloud/,
    );
  });

  it("flags injected banned phrases during guard maintenance", () => {
    const violations = listHelpGovernanceBaselineCopyViolations({
      synthetic: "Claims a provider-neutral quality baseline on every cloud.",
    });

    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations.some((entry) => entry.includes("provider-neutral quality baseline"))).toBe(true);
  });
});
