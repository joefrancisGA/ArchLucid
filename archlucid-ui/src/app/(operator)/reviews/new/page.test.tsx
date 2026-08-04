import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
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
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer-polish-copy";
import { redirect } from "next/navigation";

import NewRunPage from "./page";

describe("Start review page", () => {
  it("renders Evidence chrome with help and Sources strip", async () => {
    const ui = await NewRunPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByTestId("reviews-new-page-title")).toHaveTextContent(START_REVIEW_LABEL);
    expect(screen.getByText(REVIEWS_NEW_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-sources")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review guide help" })).toHaveAttribute(
      "href",
      "/help/review-guide",
    );
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
    expect(screen.queryByText(/pilot guidance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Guided intake/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("new-review-sample-escape")).toBeInTheDocument();
  });

  it("redirects legacy create-architecture intent to the architecture route", async () => {
    await expect(
      NewRunPage({
        searchParams: Promise.resolve({ intent: CREATE_ARCHITECTURE_INTENT }),
      }),
    ).rejects.toThrow(`REDIRECT:${ARCHITECTURES_NEW_PATH}`);

    expect(redirect).toHaveBeenCalledWith(ARCHITECTURES_NEW_PATH);
  });
});
