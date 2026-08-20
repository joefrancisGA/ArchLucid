import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIntelligenceReviewToolStrip } from "@/components/ArchitectureIntelligenceReviewToolStrip";

describe("ArchitectureIntelligenceReviewToolStrip (TB-2358)", () => {
  it("shows review workspace context with link to the reasoning tool", () => {
    render(
      <ArchitectureIntelligenceReviewToolStrip
        runId="run-abc"
        currentSurfaceId="review-workspace"
      />,
    );

    expect(screen.getByTestId("architecture-intelligence-review-tool").textContent ?? "").toContain(
      "Review workspace is the package of record",
    );
    expect(screen.getByTestId("architecture-intelligence-review-tool-peer-link")).toHaveAttribute(
      "href",
      expect.stringContaining("architecture-intelligence"),
    );
  });

  it("shows reasoning tool context with link back to the review workspace", () => {
    render(
      <ArchitectureIntelligenceReviewToolStrip
        runId="run-abc"
        currentSurfaceId="architecture-intelligence"
      />,
    );

    expect(screen.getByTestId("architecture-intelligence-review-tool-peer-link")).toHaveAttribute(
      "href",
      expect.stringContaining("run-abc"),
    );
  });
});
