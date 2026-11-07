import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/accessibility",
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  };
});

import { AccessibilityMarketingPublicView } from "@/components/marketing/AccessibilityMarketingPublicView";
import {
  ACCESSIBILITY_CANONICAL_PATH,
  ACCESSIBILITY_CLAIM_DISCIPLINE,
  ACCESSIBILITY_FOLLOW_UPS_TITLE,
  ACCESSIBILITY_SOURCES,
} from "@/lib/accessibility-evidence-copy";
import {
  expectFollowUpLink,
  whereToGoNextFollowUpLinksForTests,
} from "@/lib/claim-discipline-test-helpers";
import {
  ACCESSIBILITY_MARKETING_FIRST_VIEWPORT_TEST_ID,
  ACCESSIBILITY_MARKETING_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ACCESSIBILITY_MARKETING_SKIP_LINK_LABEL,
  ACCESSIBILITY_MARKETING_SKIP_TARGET_ID,
  ACCESSIBILITY_MARKETING_START_HERE_CARD_TITLE,
} from "@/lib/accessibility-marketing-page-copy";

describe("AccessibilityMarketingPublicView buyer-polished shell (AXX)", () => {
  it("renders skip link, header claim discipline, first-viewport start-here, and sources-only bottom strip", () => {
    render(<AccessibilityMarketingPublicView lastReviewedLine="Last reviewed: 2026-08-10" />);

    expect(screen.getByRole("link", { name: ACCESSIBILITY_MARKETING_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ACCESSIBILITY_MARKETING_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(ACCESSIBILITY_MARKETING_FIRST_VIEWPORT_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(ACCESSIBILITY_MARKETING_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      ACCESSIBILITY_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("heading", { level: 2, name: ACCESSIBILITY_MARKETING_START_HERE_CARD_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("accessibility-report-issue-cta")).toHaveAttribute(
      "href",
      "mailto:accessibility@archlucid.net",
    );

    const bottomOrientation = screen.getByTestId("accessibility-orientation-bottom");
    const sourcesSection = screen.getByTestId("accessibility-sources");
    expect(bottomOrientation).toContainElement(sourcesSection);
    expect(screen.getByRole("heading", { level: 2, name: ACCESSIBILITY_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("accessibility-claim-discipline")).not.toBeInTheDocument();

    for (const link of whereToGoNextFollowUpLinksForTests(ACCESSIBILITY_SOURCES, ACCESSIBILITY_CANONICAL_PATH)) {
      expectFollowUpLink(within(sourcesSection), link);
    }

    const firstViewport = screen.getByTestId(ACCESSIBILITY_MARKETING_FIRST_VIEWPORT_TEST_ID);
    const standardSection = screen.getByRole("heading", { level: 2, name: "Accessibility standard" });

    expect(firstViewport.compareDocumentPosition(standardSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
