import { describe, expect, it } from "vitest";

import {
  formatQuickDecisionConfidenceWorkspaceLabel,
  formatQuickDecisionFindingOwnerDisplay,
  formatQuickDecisionFindingTitleDisplay,
} from "@/lib/findings/quick-decision-finding-display";

describe("quick-decision-finding-display", () => {
  it("labels whitespace-only owners as stored empty (P-14)", () => {
    expect(formatQuickDecisionFindingOwnerDisplay("   ")).toBe("Owner was stored empty.");
    expect(formatQuickDecisionFindingOwnerDisplay(null)).toBe("Owner was not stored.");
  });

  it("maps uuid-shaped owners to display-name honesty (P-13)", () => {
    expect(formatQuickDecisionFindingOwnerDisplay("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(
      "Owner display name was not stored.",
    );
    expect(formatQuickDecisionFindingOwnerDisplay("jane.architect")).toBe("jane.architect");
  });

  it("does not treat a stored finding id as the title (P-12)", () => {
    expect(formatQuickDecisionFindingTitleDisplay("finding-1", "finding-1")).toBe(
      "Finding title was not stored.",
    );
    expect(formatQuickDecisionFindingTitleDisplay("finding-1", "Subnet exposure")).toBe("Subnet exposure");
  });

  it("labels confidence null, blank, and unexpected values (P-12)", () => {
    expect(formatQuickDecisionConfidenceWorkspaceLabel(null)).toBe("Confidence level was not stored.");
    expect(formatQuickDecisionConfidenceWorkspaceLabel("   ")).toBe("Confidence was stored empty.");
    expect(formatQuickDecisionConfidenceWorkspaceLabel("Uncertain")).toBe(
      "Confidence Uncertain has no reviewer label.",
    );
  });
});
