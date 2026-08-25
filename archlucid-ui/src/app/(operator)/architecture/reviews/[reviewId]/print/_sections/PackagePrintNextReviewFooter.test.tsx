import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PackagePrintNextReviewFooter } from "./PackagePrintNextReviewFooter";

describe("PackagePrintNextReviewFooter", () => {
  it("renders print next review link", () => {
    render(
      <PackagePrintNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/architecture/reviews/run-2/print",
        }}
      />,
    );

    expect(screen.getByTestId("package-print-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("package-print-next-review-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-2/print",
    );
  });
});
