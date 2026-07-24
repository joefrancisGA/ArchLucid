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
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer-polish-copy";
import { redirect } from "next/navigation";

import NewRunPage from "./page";

describe("Start review page", () => {
  it("renders the title without an adjacent tooltip trigger", async () => {
    const ui = await NewRunPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByRole("heading", { level: 2, name: START_REVIEW_LABEL }).parentElement).toHaveClass(
      "mt-6",
    );
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
    expect(screen.getByRole("link", { name: "Review guide" })).toHaveAttribute("href", "/help/review-guide");
    expect(screen.queryByText(/pilot guidance/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-lead")).toHaveTextContent(REVIEWS_NEW_PAGE_LEAD);
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
