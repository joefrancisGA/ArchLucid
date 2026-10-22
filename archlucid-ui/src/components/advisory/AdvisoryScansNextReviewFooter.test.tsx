import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryScansNextReviewFooter, advisoryScansNextReviewHref } from "./AdvisoryScansNextReviewFooter";

describe("AdvisoryScansNextReviewFooter", () => {
  it("builds the next review advisory scans href from run id", () => {
    expect(advisoryScansNextReviewHref("run-2")).toBe("/governance/advisory-scans?tab=scans&runId=run-2");
    expect(advisoryScansNextReviewHref("run 2")).toBe(
      "/governance/advisory-scans?tab=scans&runId=run+2",
    );
  });

  it("renders next review advisory scans link", () => {
    render(
      <AdvisoryScansNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/advisory-scans?tab=scans&runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("advisory-scans-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review advisory scans")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-scans-next-review-action")).toHaveAttribute(
      "href",
      "/governance/advisory-scans?tab=scans&runId=run-2",
    );
  });
});
