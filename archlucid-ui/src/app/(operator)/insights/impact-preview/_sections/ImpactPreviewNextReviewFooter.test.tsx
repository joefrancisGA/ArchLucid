import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImpactPreviewNextReviewFooter, impactPreviewNextReviewHref } from "./ImpactPreviewNextReviewFooter";

describe("ImpactPreviewNextReviewFooter", () => {
  it("builds the next review impact preview href from run id", () => {
    expect(impactPreviewNextReviewHref("run-2")).toBe("/insights/impact-preview?runId=run-2");
    expect(impactPreviewNextReviewHref("run 2")).toBe("/insights/impact-preview?runId=run+2");
  });

  it("renders next review impact preview link", () => {
    render(
      <ImpactPreviewNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/impact-preview?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("impact-preview-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-next-review-action")).toHaveAttribute(
      "href",
      "/insights/impact-preview?runId=run-2",
    );
  });
});
