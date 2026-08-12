import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ReviewsNewPathSwitcher", () => ({
  ReviewsNewPathSwitcher: () => <div data-testid="reviews-new-path-switcher" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
}));

import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer/buyer-polish-copy";

import NewRunPage from "./page";

describe("Start review page", () => {
  it("renders Evidence chrome with contextual help and no Sources strip", async () => {
    const ui = await NewRunPage();
    render(ui);

    expect(screen.getByTestId("reviews-new-page-title")).toHaveTextContent(START_REVIEW_LABEL);
    expect(screen.getByTestId("reviews-new-page-lead")).toHaveTextContent(REVIEWS_NEW_PAGE_LEAD);
    expect(screen.getByTestId("reviews-new-optional-cloud-hint")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How cloud connections work" })).toHaveAttribute(
      "href",
      "/help/cloud-connections",
    );
    expect(screen.getByRole("link", { name: "Open cloud connections" })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
    expect(screen.queryByTestId("reviews-new-sources")).toBeNull(); // TB-2092
    expect(screen.queryByTestId("reviews-new-claim-discipline")).toBeNull(); // TB-2092
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
    expect(document.getElementById("new-review-wizard")).not.toBeNull();
    expect(screen.queryByText(/Start with an example/i)).not.toBeInTheDocument();
  });
});
