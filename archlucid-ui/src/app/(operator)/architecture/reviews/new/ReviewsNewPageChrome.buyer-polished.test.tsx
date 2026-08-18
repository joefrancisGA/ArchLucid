import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const searchParamsGet = vi.fn<(key: string) => string | null>();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsGet(key),
  }),
  usePathname: () => "/architecture/reviews/new",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { ReviewsNewPageChrome } from "./ReviewsNewPageChrome";
import {
  BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE,
  BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE,
  BUYER_REVIEWS_NEW_QUICK_REVIEW_PAGE_SUBTITLE,
  reviewsNewPageSubtitle,
} from "@/lib/reviews-new-page-copy";
import {
  REVIEWS_NEW_PRIMARY_CONTENT_ID,
  REVIEWS_NEW_SKIP_LINK_LABEL,
} from "./reviews-new-page-surface-copy";
import { ReviewsNewPageShell } from "./ReviewsNewPageShell";

describe("ReviewsNewPageChrome buyer-polished shell (REN)", () => {
  it("renders skip link, breadcrumb, orientation strip, and detailed-tab buyer subtitle", () => {
    searchParamsGet.mockImplementation((key: string) => (key === "path" ? "detailed" : null));

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByRole("link", { name: REVIEWS_NEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEWS_NEW_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("reviews-new-primary-content")).toHaveAttribute(
      "id",
      REVIEWS_NEW_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("reviews-new-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-subtitle")).toHaveTextContent(
      BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE,
    );
    expect(screen.queryByTestId("reviews-new-optional-cloud-hint")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(reviewsNewPageSubtitle(true, "detailed")).toBe(BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE);

    const primaryContent = screen.getByTestId("reviews-new-primary-content");
    const orderedLandmarks = ["reviews-new-orientation-top", "reviews-new-path-switcher"]
      .map((testId) => primaryContent.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["reviews-new-orientation-top", "reviews-new-path-switcher"]);
  });
});

describe("ReviewsNewPageChrome buyer-polished shell (ENE)", () => {
  it("renders skip link, breadcrumb, orientation strip, and guided-intake buyer subtitle", () => {
    searchParamsGet.mockImplementation((key: string) => (key === "path" ? "guided-intake" : null));

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByRole("link", { name: REVIEWS_NEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEWS_NEW_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("reviews-new-primary-content")).toHaveAttribute(
      "id",
      REVIEWS_NEW_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("reviews-new-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText("Guided questions")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-subtitle")).toHaveTextContent(
      BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE,
    );
    expect(screen.queryByTestId("reviews-new-optional-cloud-hint")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(reviewsNewPageSubtitle(true, "guided-intake")).toBe(BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE);
  });
});

describe("ReviewsNewPageChrome buyer-polished shell (REQ)", () => {
  it("renders skip link, breadcrumb, orientation strip, quick-start subtitle, and hub chrome", () => {
    searchParamsGet.mockImplementation((key: string) => (key === "path" ? "quick-review" : null));

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByRole("link", { name: REVIEWS_NEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEWS_NEW_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("reviews-new-primary-content")).toHaveAttribute(
      "id",
      REVIEWS_NEW_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("reviews-new-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText("Quick start")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-subtitle")).toHaveTextContent(
      BUYER_REVIEWS_NEW_QUICK_REVIEW_PAGE_SUBTITLE,
    );
    expect(screen.getByTestId("reviews-new-optional-cloud-hint")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(reviewsNewPageSubtitle(true, "quick-review")).toBe(BUYER_REVIEWS_NEW_QUICK_REVIEW_PAGE_SUBTITLE);
  });
});

describe("ReviewsNewPageChrome buyer-polished hub", () => {
  it("keeps contextual help and hub lead when no path tab is active", () => {
    searchParamsGet.mockImplementation(() => null);

    render(<ReviewsNewPageChrome />);

    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-optional-cloud-hint")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-subtitle")).toHaveTextContent(
      reviewsNewPageSubtitle(true, null),
    );
    expect(screen.queryByText("Quick start")).not.toBeInTheDocument();
  });
});
