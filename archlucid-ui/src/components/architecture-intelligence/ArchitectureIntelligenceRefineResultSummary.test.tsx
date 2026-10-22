import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureIntelligenceRefineResultSummary } from "@/components/architecture-intelligence/ArchitectureIntelligenceRefineResultSummary";

vi.mock("@/components/usability/SimulatorModeAiOperationNotice", () => ({
  SimulatorModeAiOperationNotice: () => null,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
}));

describe("ArchitectureIntelligenceRefineResultSummary", () => {
  it("shows findings preview and next steps after refine completes", () => {
    render(
      <ArchitectureIntelligenceRefineResultSummary
        testIdPrefix="architecture-draft-ai-refine"
        canPublish={false}
        result={{
          runId: "ai-run-1",
          integrityPassedFindingIds: ["f1"],
          specialistReviews: [
            {
              findings: [
                {
                  findingId: "f1",
                  title: "Missing authentication boundary",
                  severity: "High",
                  conclusion: "Public API lacks auth controls.",
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("architecture-draft-ai-refine-headline")).toHaveTextContent(
      "Analysis complete · 1 evidence-backed finding",
    );
    expect(screen.getByText("Missing authentication boundary")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-ai-refine-next-steps")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-ai-refine-start-review")).toBeInTheDocument();
  });
});
