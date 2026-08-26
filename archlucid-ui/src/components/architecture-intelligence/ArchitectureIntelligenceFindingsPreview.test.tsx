import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIntelligenceFindingsPreview } from "@/components/architecture-intelligence/ArchitectureIntelligenceFindingsPreview";

describe("ArchitectureIntelligenceFindingsPreview", () => {
  it("lists integrity-passed findings with severity and conclusion", () => {
    render(
      <ArchitectureIntelligenceFindingsPreview
        testIdPrefix="architecture-draft-ai-refine"
        result={{
          runId: "run-001",
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

    expect(screen.getByTestId("architecture-draft-ai-refine-preview")).toBeInTheDocument();
    expect(screen.getByText("Missing authentication boundary")).toBeInTheDocument();
    expect(screen.getByText("Public API lacks auth controls.")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-ai-refine-show-all")).toBeInTheDocument();
  });
});
