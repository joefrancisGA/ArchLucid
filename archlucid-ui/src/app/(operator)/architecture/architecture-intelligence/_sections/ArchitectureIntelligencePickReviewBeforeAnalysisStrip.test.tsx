import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureIntelligencePickReviewBeforeAnalysisStrip } from "./ArchitectureIntelligencePickReviewBeforeAnalysisStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-ai-1", displayTitle: "Network review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("ArchitectureIntelligencePickReviewBeforeAnalysisStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <ArchitectureIntelligencePickReviewBeforeAnalysisStrip
        selectedReviewId=""
        onSelectReview={() => undefined}
      />,
    );

    expect(screen.getByTestId("architecture-intelligence-pick-review-before-analysis-strip")).toBeInTheDocument();
  });
});
