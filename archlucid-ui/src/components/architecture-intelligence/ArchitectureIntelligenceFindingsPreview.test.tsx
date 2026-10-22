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

  it("shows finding-count omission when integrity ids were not stored", () => {
    render(
      <ArchitectureIntelligenceFindingsPreview
        result={{
          integrityPassedFindingIds: undefined,
          specialistReviews: [{ findings: [] }],
        }}
      />,
    );

    expect(screen.getByText("Finding count was not stored.")).toBeInTheDocument();
    expect(
      screen.queryByText(/No evidence-backed findings were returned/i),
    ).not.toBeInTheDocument();
  });

  it("shows review-link omission when findings exist without a run id", () => {
    render(
      <ArchitectureIntelligenceFindingsPreview
        result={{
          integrityPassedFindingIds: ["f1"],
          specialistReviews: [
            {
              findings: [
                {
                  findingId: "f1",
                  title: "Gap",
                  severity: "High",
                  conclusion: "Detail",
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("architecture-intelligence-findings-review-link-not-stored")).toHaveTextContent(
      "Review link was not stored.",
    );
    expect(screen.queryByTestId("architecture-intelligence-findings-show-all")).not.toBeInTheDocument();
  });
});
