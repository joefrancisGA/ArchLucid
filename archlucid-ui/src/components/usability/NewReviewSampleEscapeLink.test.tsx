import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("NewReviewSampleEscapeLink", () => {
  it("renders the calm, expert-facing guidance copy", () => {
    render(<NewReviewSampleEscapeLink />);

    expect(
      screen.getByTestId("new-review-sample-escape"),
    ).toHaveTextContent("Start with an example: Skip setup and open a completed sample package.");
  });

  it("does not render the retired salesy lead copy", () => {
    render(<NewReviewSampleEscapeLink />);

    expect(screen.queryByText(/not ready to configure/i)).not.toBeInTheDocument();
  });

  it("keeps the completed sample package portion as a clickable link to the sample review", () => {
    render(<NewReviewSampleEscapeLink />);

    const link = screen.getByRole("link", { name: "Skip setup and open a completed sample package" });

    expect(link).toHaveAttribute("href", `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);
    expect(link.className).toMatch(/underline/);
  });
});
