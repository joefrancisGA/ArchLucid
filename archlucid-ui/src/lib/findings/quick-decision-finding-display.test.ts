import { describe, expect, it } from "vitest";

import {
  formatQuickDecisionConfidenceWorkspaceLabel,
  formatQuickDecisionFindingCategoryLine,
  formatQuickDecisionFindingOwnerDisplay,
  formatQuickDecisionFindingTitleDisplay,
} from "@/lib/findings/quick-decision-finding-display";

describe("quick-decision-finding-display", () => {
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

  it("labels finding category null, blank, and stored values (P-20)", () => {
    expect(formatQuickDecisionFindingCategoryLine(null)).toBe("Finding category was not stored.");
    expect(formatQuickDecisionFindingCategoryLine("")).toBe("Finding category was stored empty.");
    expect(formatQuickDecisionFindingCategoryLine("  cost  ")).toBe("cost");
  });
});
