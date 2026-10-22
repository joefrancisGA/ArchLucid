import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPacksNextReviewFooter, policyPacksNextReviewHref } from "./PolicyPacksNextReviewFooter";

describe("PolicyPacksNextReviewFooter", () => {
  it("builds the next review policy packs href from run id", () => {
    expect(policyPacksNextReviewHref("run-2")).toBe("/governance/policy-packs?reviewId=run-2");
  });

  it("renders next review policy packs link", () => {
    render(
      <PolicyPacksNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/policy-packs?reviewId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("policy-packs-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-next-review-action")).toHaveAttribute(
      "href",
      "/governance/policy-packs?reviewId=run-2",
    );
  });
});
