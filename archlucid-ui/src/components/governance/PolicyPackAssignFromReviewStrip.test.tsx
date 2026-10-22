import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPackAssignFromReviewStrip } from "./PolicyPackAssignFromReviewStrip";

describe("PolicyPackAssignFromReviewStrip", () => {
  it("links to policy packs with review context", () => {
    render(<PolicyPackAssignFromReviewStrip reviewId="run-123" reviewTitle="Claims intake review" />);

    expect(screen.getByTestId("policy-pack-assign-from-review-strip")).toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-assign-from-review-action")).toHaveAttribute(
      "href",
      "/governance/policy-packs?reviewId=run-123",
    );
  });
});
