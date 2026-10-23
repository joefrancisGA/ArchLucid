import { describe, expect, it } from "vitest";

import {
  formatQuickDecisionConfidenceWorkspaceLabel,
  formatQuickDecisionFindingOwnerDisplay,
} from "@/lib/findings/quick-decision-finding-display";

describe("quick-decision-finding-display", () => {
  it("maps uuid-shaped owners to display-name honesty (P-13)", () => {
    expect(formatQuickDecisionFindingOwnerDisplay("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(
      "Owner display name was not stored.",
    );
    expect(formatQuickDecisionFindingOwnerDisplay("jane.architect")).toBe("jane.architect");
  });

  it("labels confidence null, blank, and unexpected values (P-12)", () => {
    expect(formatQuickDecisionConfidenceWorkspaceLabel(null)).toBe("Confidence level was not stored.");
    expect(formatQuickDecisionConfidenceWorkspaceLabel("   ")).toBe("Confidence was stored empty.");
    expect(formatQuickDecisionConfidenceWorkspaceLabel("Uncertain")).toBe(
      "Confidence Uncertain has no reviewer label.",
    );
  });
});
