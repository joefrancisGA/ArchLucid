import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ReviewsNewPathSwitcher", () => ({
  ReviewsNewPathSwitcher: () => <div data-testid="reviews-new-path-switcher" />,
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
    expect(screen.getByTestId("reviews-new-page-lead")).toHaveTextContent(REVIEWS_NEW_PAGE_LEAD);
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(document.getElementById("new-review-wizard")).not.toBeNull();
    expect(screen.queryByText(/Start with an example/i)).not.toBeInTheDocument();
  });
});
