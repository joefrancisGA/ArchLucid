import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ReviewsNewPathSwitcher", () => ({
  ReviewsNewPathSwitcher: () => <div data-testid="reviews-new-path-switcher" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => ({
    get: () => null,
  }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { REVIEWS_NEW_CLAIM_DISCIPLINE } from "@/lib/reviews-new-evidence-copy";

import NewRunPage from "./page";
import {
  REVIEWS_NEW_FIRST_VIEWPORT_ID,
  REVIEWS_NEW_SKIP_LINK_LABEL,
  REVIEWS_NEW_SKIP_TARGET_ID,
} from "./reviews-new-page-surface-copy";

describe("Start review page", () => {
  it("renders Evidence chrome with contextual help, header claim discipline, and skip link", async () => {
    const ui = await NewRunPage();
    render(ui);

    expect(screen.getByRole("link", { name: REVIEWS_NEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEWS_NEW_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(REVIEWS_NEW_FIRST_VIEWPORT_ID)).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-title")).toHaveTextContent(START_REVIEW_LABEL);
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
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
    expect(screen.getByTestId("reviews-new-claim-discipline")).toHaveTextContent(
      REVIEWS_NEW_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
    expect(document.getElementById("new-review-wizard")).not.toBeNull();
    expect(screen.queryByText(/Start with an example/i)).not.toBeInTheDocument();
  });
});
