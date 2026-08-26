import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SignedRecordsListNextReviewFooter,
  signedRecordsListNextReviewHref,
} from "./SignedRecordsListNextReviewFooter";

describe("SignedRecordsListNextReviewFooter", () => {
  it("builds the next review signed records href from run id", () => {
    expect(signedRecordsListNextReviewHref("run-2")).toBe("/governance/sealed-records?runId=run-2");
  });

  it("renders next review signed records link", () => {
    render(
      <SignedRecordsListNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/sealed-records?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("signed-records-list-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("signed-records-list-next-review-action")).toHaveAttribute(
      "href",
      "/governance/sealed-records?runId=run-2",
    );
  });
});
