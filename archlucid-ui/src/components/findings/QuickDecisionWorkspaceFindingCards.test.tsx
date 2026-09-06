import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuickDecisionWorkspacePrimaryFindingCard } from "@/components/findings/QuickDecisionWorkspacePrimaryFindingCard";
import { QuickDecisionWorkspaceSecondaryFindingCard } from "@/components/findings/QuickDecisionWorkspaceSecondaryFindingCard";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

vi.mock("@/hooks/useArchitectWorkspaceChrome", () => ({
  useArchitectWorkspaceChrome: () => true,
}));

function buildFinding(wireJson: string): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Sample finding",
    recommendation: "Fix it.",
    severityValue: 2,
    findingOrder: 0,
    aiReasoning: { wireJson, reasoningTraceJson: null },
    isMuted: false,
    muteReason: null,
    enforcementTier: "Violation",
    confidenceLevel: "High",
  };
}

const cardContext = {
  runId: "run-1",
  reviewId: "review-1",
  packageId: "package-1",
};

describe("QuickDecisionWorkspace finding cards (PC-10)", () => {
  it("primary card mounts record correction when a disposition is on the wire", () => {
    const finding = buildFinding(JSON.stringify({ latestDisposition: "Accepted" }));

    render(
      <QuickDecisionWorkspacePrimaryFindingCard
        context={cardContext}
        finding={finding}
        canMutate={false}
        askPanelOpen={false}
        onToggleAskPanel={vi.fn()}
        onViewReasoning={vi.fn()}
        onMute={vi.fn()}
      />,
    );

    expect(screen.getByTestId("finding-workspace-record-correction-finding-1")).toBeInTheDocument();
  });

  it("secondary card mounts record correction when a disposition is on the wire", () => {
    const finding = buildFinding(JSON.stringify({ latestDisposition: "Accepted" }));

    render(<QuickDecisionWorkspaceSecondaryFindingCard context={cardContext} finding={finding} />);

    expect(screen.getByTestId("finding-workspace-record-correction-finding-1")).toBeInTheDocument();
  });

  it("hides record correction when no disposition is recorded", () => {
    const finding = buildFinding(JSON.stringify({}));

    render(
      <QuickDecisionWorkspacePrimaryFindingCard
        context={cardContext}
        finding={finding}
        canMutate={false}
        askPanelOpen={false}
        onToggleAskPanel={vi.fn()}
        onViewReasoning={vi.fn()}
        onMute={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("finding-workspace-record-correction-finding-1")).not.toBeInTheDocument();
  });
});
