import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsGet = vi.fn<(key: string) => string | null>();
const useReviewsNewSpecimenPreviewPresentation = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsGet(key),
  }),
  usePathname: () => "/architecture/reviews/new",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("./use-reviews-new-specimen-preview-presentation", () => ({
  useReviewsNewSpecimenPreviewPresentation: () => useReviewsNewSpecimenPreviewPresentation(),
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

import {
  BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE,
  BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE,
  BUYER_REVIEWS_NEW_QUICK_REVIEW_PAGE_SUBTITLE,
  reviewsNewPageSubtitle,
} from "@/lib/reviews-new-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { REVIEWS_NEW_ORIENTATION_SOURCES } from "@/lib/reviews-new-evidence-copy";
import {
  REVIEWS_NEW_FIRST_VIEWPORT_ID,
  REVIEWS_NEW_PRIMARY_CONTENT_ID,
  REVIEWS_NEW_SKIP_LINK_LABEL,
  REVIEWS_NEW_SKIP_TARGET_ID,
} from "./reviews-new-page-surface-copy";
import { ReviewsNewPageShell } from "./ReviewsNewPageShell";
import {
  REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK,
  REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA,
} from "@/lib/buyer/buyer-polish-copy";

beforeEach(() => {
  useReviewsNewSpecimenPreviewPresentation.mockReturnValue({
    showProminentSection: true,
    showHeaderLinks: false,
  });
});

function expectFirstViewportOrientationAboveWorkspace(pathSwitcherTestId: string): void {
  const primaryContent = screen.getByTestId("reviews-new-primary-content");
  const firstViewport = screen.getByTestId(REVIEWS_NEW_FIRST_VIEWPORT_ID);
  const pageTitle = screen.getByTestId("reviews-new-page-title");
  const orientationTop = screen.getByTestId("reviews-new-orientation-top");
  const pathSwitcher = screen.getByTestId(pathSwitcherTestId);

  expect(primaryContent).toContainElement(pageTitle);
  expect(primaryContent).toContainElement(firstViewport);
  expect(firstViewport).not.toContainElement(pageTitle);
  expect(firstViewport).toContainElement(orientationTop);
  expect(firstViewport).toContainElement(pathSwitcher);
  expect(orientationTop.compareDocumentPosition(pathSwitcher) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
}

describe("ReviewsNewPageChrome buyer-polished shell (RNX)", () => {
  it("renders skip link, first-viewport band, orientation above path switcher, claim discipline, and hides contextual help", () => {
    searchParamsGet.mockImplementation(() => null);

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByRole("link", { name: REVIEWS_NEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEWS_NEW_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("reviews-new-primary-content")).toHaveAttribute(
      "id",
      REVIEWS_NEW_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("reviews-new-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-settings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-optional-cloud-hint")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-subtitle")).toHaveTextContent(reviewsNewPageSubtitle(true, null));
    expectFirstViewportOrientationAboveWorkspace("reviews-new-path-switcher");
  });

  it("adds specimen preview links to the header hint row for returning tenants", () => {
    useReviewsNewSpecimenPreviewPresentation.mockReturnValue({
      showProminentSection: false,
      showHeaderLinks: true,
    });
    searchParamsGet.mockImplementation(() => null);

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByRole("link", { name: REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "See what you will get" })).not.toBeInTheDocument();
  });
});

describe("ReviewsNewPageChrome buyer-polished shell (REN)", () => {
  it("renders skip link, breadcrumb, orientation strip above path tabs, and detailed-tab buyer subtitle", () => {
    searchParamsGet.mockImplementation((key: string) => (key === "path" ? "detailed" : null));

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByRole("link", { name: REVIEWS_NEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEWS_NEW_SKIP_TARGET_ID}`,
    );
    expect(screen.queryByTestId("reviews-new-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-settings-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Related resources" })).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-subtitle")).toHaveTextContent(
      BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE,
    );
    expect(screen.queryByTestId("reviews-new-optional-cloud-hint")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-path-hint")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(reviewsNewPageSubtitle(true, "detailed")).toBe(BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE);
    expectFirstViewportOrientationAboveWorkspace("reviews-new-path-switcher");

    const sourcesSection = screen.getByTestId("reviews-new-settings-sources");
    for (const source of filterWhereToGoNextFollowUpLinks(REVIEWS_NEW_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});

describe("ReviewsNewPageChrome buyer-polished shell (ENE)", () => {
  it("omits shell-level related resources on guided-intake and hides duplicate path hint", () => {
    searchParamsGet.mockImplementation((key: string) => (key === "path" ? "guided-intake" : null));

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByTestId("reviews-new-page-subtitle")).toHaveTextContent(
      BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE,
    );
    expect(screen.queryByTestId("reviews-new-orientation-top")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-settings-sources")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Related resources" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-optional-cloud-hint")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-path-hint")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(reviewsNewPageSubtitle(true, "guided-intake")).toBe(BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE);

    const primaryContent = screen.getByTestId("reviews-new-primary-content");
    const firstViewport = screen.getByTestId(REVIEWS_NEW_FIRST_VIEWPORT_ID);
    const pageTitle = screen.getByTestId("reviews-new-page-title");
    const pathSwitcher = screen.getByTestId("reviews-new-path-switcher");

    expect(primaryContent).toContainElement(pageTitle);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(pageTitle);
    expect(firstViewport).toContainElement(pathSwitcher);
  });
});

describe("ReviewsNewPageChrome buyer-polished shell (REQ)", () => {
  it("renders skip link, orientation above path tabs, quick-start subtitle, and hides contextual help", () => {
    searchParamsGet.mockImplementation((key: string) => (key === "path" ? "quick-review" : null));

    render(
      <ReviewsNewPageShell>
        <div data-testid="reviews-new-path-switcher" />
      </ReviewsNewPageShell>,
    );

    expect(screen.getByRole("link", { name: REVIEWS_NEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEWS_NEW_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("reviews-new-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-page-subtitle")).toHaveTextContent(
      BUYER_REVIEWS_NEW_QUICK_REVIEW_PAGE_SUBTITLE,
    );
    expect(screen.getByTestId("reviews-new-optional-cloud-hint")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(reviewsNewPageSubtitle(true, "quick-review")).toBe(BUYER_REVIEWS_NEW_QUICK_REVIEW_PAGE_SUBTITLE);
    expectFirstViewportOrientationAboveWorkspace("reviews-new-path-switcher");
  });
});
