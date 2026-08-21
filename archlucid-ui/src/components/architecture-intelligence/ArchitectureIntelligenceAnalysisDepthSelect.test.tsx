import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureIntelligenceAnalysisDepthSelect } from "./ArchitectureIntelligenceAnalysisDepthSelect";
import { architectureIntelligenceReviewTierLabel } from "@/lib/architecture/architecture-intelligence-review-tier";

describe("ArchitectureIntelligenceAnalysisDepthSelect", () => {
  it("shows the operator label for the selected tier, not the raw token", () => {
    render(
      <ArchitectureIntelligenceAnalysisDepthSelect
        id="analysis-depth"
        testId="analysis-depth"
        value="Standard"
        onValueChange={vi.fn()}
      />,
    );

    const trigger = screen.getByTestId("analysis-depth");

    expect(trigger).toHaveTextContent(architectureIntelligenceReviewTierLabel("Standard"));
    expect(trigger.textContent?.trim().toLowerCase()).not.toBe("standard");
    expect(screen.getByRole("combobox", { name: "Analysis depth" })).toBeInTheDocument();
  });
});
