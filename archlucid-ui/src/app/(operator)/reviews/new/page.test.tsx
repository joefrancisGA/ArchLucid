import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ReviewsNewPathSwitcher", () => ({
  ReviewsNewPathSwitcher: () => <div data-testid="reviews-new-path-switcher" />,
}));

vi.mock("@/components/usability/NewReviewSampleEscapeLink", () => ({
  NewReviewSampleEscapeLink: () => null,
}));

import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer-polish-copy";

import NewRunPage from "./page";

describe("New Architecture Review page", () => {
  it("renders the title without an adjacent tooltip trigger", () => {
    render(<NewRunPage />);

    expect(screen.getByRole("heading", { level: 2, name: "New Architecture Review" })).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
    expect(screen.getByRole("link", { name: "Review guide" })).toHaveAttribute("href", "/help/review-guide");
    expect(screen.queryByText(/pilot guidance/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-lead")).toHaveTextContent(REVIEWS_NEW_PAGE_LEAD);
    expect(screen.queryByText(/Guided intake/i)).not.toBeInTheDocument();
  });
});
