import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingMergeConflictListCue } from "@/components/findings/FindingMergeConflictListCue";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working", mounted: true }),
}));

function mergeConflictFinding(findingId: string): QuickDecisionFinding {
  return {
    findingId,
    title: "Merge conflict",
    recommendation: "Resolve before sealing.",
    severityValue: 2,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    policyRuleId: "finding-merge-conflict",
  };
}

describe("FindingMergeConflictListCue (RS-14)", () => {
  it("shows a Working list cue when merge conflict findings are present", () => {
    render(
      <FindingMergeConflictListCue
        runId="run-merge"
        findings={[mergeConflictFinding("f-merge-1")]}
      />,
    );

    expect(screen.getByTestId("finding-merge-conflict-list-cue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open merge conflict resolution/i })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-merge/findings/f-merge-1",
    );
  });
});
