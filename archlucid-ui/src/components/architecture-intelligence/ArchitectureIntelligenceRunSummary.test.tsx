import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureIntelligenceRunSummary } from "@/components/architecture-intelligence/ArchitectureIntelligenceRunSummary";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
}));

describe("ArchitectureIntelligenceRunSummary", () => {
  it("shows a human headline and hides jargon until technical details are expanded", () => {
    render(
      <ArchitectureIntelligenceRunSummary
        testIdPrefix="architecture-intelligence-refine"
        result={{
          model: { elements: [{}, {}, {}] },
          integrityPassedFindingIds: ["f1", "f2", "f3"],
          cacheHit: false,
        }}
      />,
    );

    expect(screen.getByTestId("architecture-intelligence-refine-headline")).toHaveTextContent(
      "Analysis complete · 3 evidence-backed findings",
    );
    expect(screen.getByTestId("architecture-intelligence-refine-headline")).not.toHaveTextContent(
      "Model elements",
    );
    expect(screen.getByTestId("architecture-intelligence-refine-headline")).not.toHaveTextContent(
      "Cache miss",
    );

    expect(screen.getByTestId("architecture-intelligence-refine-technical-details")).toHaveTextContent(
      "Structured details parsed",
    );
    expect(screen.getByTestId("architecture-intelligence-refine-technical-details")).toHaveTextContent(
      "Fresh analysis run",
    );
  });
});
