import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ReviewsNewPathSwitcher", () => ({
  ReviewsNewPathSwitcher: () => <div data-testid="reviews-new-path-switcher" />,
}));

vi.mock("@/components/usability/NewReviewSampleEscapeLink", () => ({
  NewReviewSampleEscapeLink: () => <div data-testid="new-review-sample-escape" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
}));

import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer-polish-copy";

import NewRunPage from "./page";

describe("Start review page", () => {
  it("renders Evidence chrome with help and Sources strip", async () => {
    const ui = await NewRunPage();
    render(ui);

    expect(screen.getByTestId("reviews-new-page-title")).toHaveTextContent(START_REVIEW_LABEL);
    expect(screen.getByText(REVIEWS_NEW_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-sources")).toBeNull(); // TB-2092
    expect(screen.getByTestId("reviews-new-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(/Intake only/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review guide help" })).toHaveAttribute(
      "href",
      "/help/review-guide",
    );
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
    expect(screen.queryByText(/pilot guidance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Guided intake/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("new-review-sample-escape")).toBeInTheDocument();
  });
});
