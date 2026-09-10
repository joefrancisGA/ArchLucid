import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/architecture/reviews",
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
  };
});

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  REVIEWS_HUB_CLAIM_DISCIPLINE,
  REVIEWS_HUB_SOURCES,
} from "@/lib/reviews-hub-evidence-copy";
import {
  REVIEWS_HUB_FIRST_VIEWPORT_ID,
  REVIEWS_HUB_PRIMARY_CONTENT_ID,
  REVIEWS_HUB_SKIP_LINK_LABEL,
  REVIEWS_HUB_SKIP_TARGET_ID,
} from "@/lib/reviews-hub-page-copy";
import { RunsPageView } from "./RunsPageView";
import type { RunsPageModel } from "./runs-page-model";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/operator/OperatorPageContainer", () => ({
  OperatorPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => [],
  useArchitectureDraftRegistryHydrated: () => true,
}));

vi.mock("@/components/operator/OperatorWelcomeOnboarding", () => ({
  OperatorWelcomeOnboarding: () => null,
}));

vi.mock("@/components/runs/RunsListProofHeadline", () => ({
  RunsListProofHeadline: () => null,
}));

vi.mock("./reviews-hub-deferred-chunks", async () => {
  const { ReviewsHubReviewInventory } = await import("./ReviewsHubReviewInventory");

  return {
    OperatorWelcomeOnboardingDeferred: () => null,
    ReviewsHubBeforeAfterDeltaPanelDeferred: () => null,
    ReviewsHubExploreSamplesDeferred: () => null,
    ReviewsHubPackageIncludesDeferred: () => null,
    ReviewsHubReviewInventoryDeferred: ReviewsHubReviewInventory,
    RunsIndexBeforeAfterPanelDeferred: () => null,
    RunsListAggregateErrorBoundaryDeferred: () => null,
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
    isBuyerSafeDemoMarketingChromeEnv: () => false,
    isOperatorExperienceFullShellEnv: () => false,
  };
});

function baseModel(overrides: Partial<RunsPageModel> = {}): RunsPageModel {
  return {
    projectId: "default",
    page: 1,
    pageSize: 25,
    runs: [],
    totalCount: 0,
    loadFailure: null,
    malformedMessage: null,
    usedStaticRunsFallback: false,
    nextCursorForClient: null,
    projectTitle: "Project: default",
    firstCommittedRunId: null,
    welcomeOnboardingEligible: false,
    ...overrides,
  };
}

describe("RunsPageView buyer-polished shell (RE)", () => {
  it("renders skip link, first-viewport band, orientation above inventory, claim discipline, and Sources links", () => {
    render(
      <RunsPageView
        model={baseModel({
          totalCount: 1,
          runs: [
            {
              runId: "review-001",
              projectId: "default",
              createdUtc: "2026-01-15T12:00:00.000Z",
              hasFindingsSnapshot: true,
              findingCount: 2,
            } as RunsPageModel["runs"][number],
          ],
        })}
      />,
    );

    expect(screen.getByRole("link", { name: REVIEWS_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEWS_HUB_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(REVIEWS_HUB_PRIMARY_CONTENT_ID)).toHaveAttribute("id", REVIEWS_HUB_PRIMARY_CONTENT_ID);
    expect(screen.getByTestId("reviews-hub-claim-discipline").textContent).toContain(
      REVIEWS_HUB_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId(REVIEWS_HUB_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(REVIEWS_HUB_FIRST_VIEWPORT_ID);
    const pageTitle = screen.getByTestId("reviews-hub-page-title");
    const orientationTop = screen.getByTestId("reviews-hub-orientation-top");
    const recentPackages = screen.getByTestId("reviews-hub-recent-packages");
    const sourcesSection = screen.getByTestId("reviews-hub-sources");

    expect(primaryContent).toContainElement(pageTitle);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(pageTitle);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(recentPackages);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(recentPackages) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(REVIEWS_HUB_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
