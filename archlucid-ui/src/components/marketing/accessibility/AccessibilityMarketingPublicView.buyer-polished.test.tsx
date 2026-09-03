import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessibilityMarketingPublicView } from "@/components/marketing/AccessibilityMarketingPublicView";
import {
  ACCESSIBILITY_CLAIM_DISCIPLINE,
  ACCESSIBILITY_FOLLOW_UPS_TITLE,
  ACCESSIBILITY_SOURCES,
} from "@/lib/accessibility-evidence-copy";
import {
  ACCESSIBILITY_MARKETING_FIRST_VIEWPORT_TEST_ID,
  ACCESSIBILITY_MARKETING_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ACCESSIBILITY_MARKETING_SKIP_LINK_LABEL,
  ACCESSIBILITY_MARKETING_SKIP_TARGET_ID,
  ACCESSIBILITY_MARKETING_START_HERE_CARD_TITLE,
} from "@/lib/accessibility-marketing-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

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

    for (const link of filterWhereToGoNextFollowUpLinks(ACCESSIBILITY_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }

    const firstViewport = screen.getByTestId(ACCESSIBILITY_MARKETING_FIRST_VIEWPORT_TEST_ID);
    const standardSection = screen.getByRole("heading", { level: 2, name: "Accessibility standard" });

    expect(firstViewport.compareDocumentPosition(standardSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
