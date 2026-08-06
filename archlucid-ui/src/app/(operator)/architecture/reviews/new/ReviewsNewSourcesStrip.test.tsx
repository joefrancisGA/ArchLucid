import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewsNewSourcesStrip } from "@/app/(operator)/architecture/reviews/new/ReviewsNewSourcesStrip";
import { REVIEWS_NEW_CANONICAL_PATH, REVIEWS_NEW_SOURCES } from "@/lib/reviews-new-evidence-copy";

describe("ReviewsNewSourcesStrip", () => {
  it("lists follow-up Sources without self-linking reviews/new", () => {
    render(<ReviewsNewSourcesStrip />);

    expect(screen.getByTestId("reviews-new-sources")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-claim-discipline")).toHaveTextContent(/Intake only|signed-review diligence/i);

    const sources = screen.getByTestId("reviews-new-sources");

    for (const link of REVIEWS_NEW_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(REVIEWS_NEW_SOURCES.some((link) => link.href === REVIEWS_NEW_CANONICAL_PATH)).toBe(false);
  });
});
