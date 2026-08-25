import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompareNextReviewFooter, compareNextReviewHref } from "./CompareNextReviewFooter";

describe("CompareNextReviewFooter", () => {
  it("builds compare href advancing the later run", () => {
    expect(compareNextReviewHref("run-1", "run-2")).toContain("run-2");
    expect(compareNextReviewHref("", "run-2")).toContain("run-2");
  });

  it("renders next review compare link", () => {
    render(
      <CompareNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/compare-two-reviews?leftRunId=run-1&rightRunId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("compare-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("compare-next-review-action")).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews?leftRunId=run-1&rightRunId=run-2",
    );
  });
});
