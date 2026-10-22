import { describe, expect, it } from "vitest";

import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

import {
  formatGovernanceResolutionWorkingResultsLabel,
  governanceResolutionSectionCountHeading,
  presentGovernanceResolutionCollectionCount,
} from "./governance-resolution-collection-count-display";

const baseResolution = {
  decisions: [],
  conflicts: [],
  notes: [],
  effectiveContent: {},
} as EffectiveGovernanceResolutionResult;

describe("governance-resolution-collection-count-display", () => {
  it("reports not returned when collection is missing", () => {
    const data = { ...baseResolution, decisions: undefined } as EffectiveGovernanceResolutionResult;

    expect(presentGovernanceResolutionCollectionCount(data, "decisions")).toBe("Not returned");
    expect(governanceResolutionSectionCountHeading("decisions", data)).toBe(
      "Resolution decisions (not returned)",
    );
  });

  it("formats working results label with explicit omissions", () => {
    const data = { ...baseResolution, conflicts: undefined } as EffectiveGovernanceResolutionResult;

    expect(formatGovernanceResolutionWorkingResultsLabel(false, data)).toBe(
      "0 decisions · Conflicts not returned",
    );
  });

  it("formats counts when arrays are present", () => {
    const data = {
      ...baseResolution,
      decisions: [{ itemType: "Rule", itemKey: "a", winningPackId: "p", reason: "r" }],
      conflicts: [],
    } as EffectiveGovernanceResolutionResult;

    expect(formatGovernanceResolutionWorkingResultsLabel(false, data)).toBe("1 decisions · 0 conflicts");
  });
});
