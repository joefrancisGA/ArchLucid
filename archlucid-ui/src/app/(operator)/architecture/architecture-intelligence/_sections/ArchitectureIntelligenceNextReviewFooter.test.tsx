import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ArchitectureIntelligenceNextReviewFooter,
  architectureIntelligenceNextReviewHref,
} from "./ArchitectureIntelligenceNextReviewFooter";

describe("ArchitectureIntelligenceNextReviewFooter", () => {
  it("builds the next review architecture intelligence href from run id", () => {
    expect(architectureIntelligenceNextReviewHref("run-2")).toBe(
      "/architecture/architecture-intelligence?runId=run-2",
    );
    expect(architectureIntelligenceNextReviewHref("run 2")).toBe(
      "/architecture/architecture-intelligence?runId=run+2",
    );
  });

  it("renders next review architecture intelligence link", () => {
    render(
      <ArchitectureIntelligenceNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/architecture/architecture-intelligence?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("architecture-intelligence-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review architecture intelligence")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-next-review-action")).toHaveAttribute(
      "href",
      "/architecture/architecture-intelligence?runId=run-2",
    );
  });
});
