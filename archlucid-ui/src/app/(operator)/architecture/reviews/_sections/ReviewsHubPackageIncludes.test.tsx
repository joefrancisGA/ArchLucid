import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewsHubPackageIncludes } from "@/app/(operator)/architecture/reviews/_sections/ReviewsHubPackageIncludes";
import { REVIEWS_HUB_INCLUDES_ITEMS } from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-copy";

describe("ReviewsHubPackageIncludes", () => {
  it("renders distinct review deliverable chips without review-record qualifier overlap", () => {
    render(<ReviewsHubPackageIncludes />);

    for (const item of REVIEWS_HUB_INCLUDES_ITEMS) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(screen.getByText("Architecture description")).toBeInTheDocument();
    expect(screen.getByText("Sealed review record")).toBeInTheDocument();
    expect(screen.queryByText("Review record")).not.toBeInTheDocument();
    expect(new Set(REVIEWS_HUB_INCLUDES_ITEMS).size).toBe(REVIEWS_HUB_INCLUDES_ITEMS.length);
  });
});
