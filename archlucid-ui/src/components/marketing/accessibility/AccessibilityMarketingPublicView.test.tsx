import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessibilityMarketingPublicView } from "@/components/marketing/AccessibilityMarketingPublicView";
import {
  ACCESSIBILITY_MARKETING_FIRST_VIEWPORT_TEST_ID,
  ACCESSIBILITY_MARKETING_SKIP_LINK_LABEL,
  ACCESSIBILITY_MARKETING_SKIP_TARGET_ID,
} from "@/lib/accessibility-marketing-page-copy";

describe("AccessibilityMarketingPublicView", () => {
  it("exposes skip link, report CTA, and at-a-glance before detailed sections", () => {
    render(<AccessibilityMarketingPublicView lastReviewedLine="Last reviewed: 2026-08-10" />);

    expect(screen.getByRole("link", { name: ACCESSIBILITY_MARKETING_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ACCESSIBILITY_MARKETING_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(ACCESSIBILITY_MARKETING_FIRST_VIEWPORT_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("accessibility-report-issue-cta")).toHaveAttribute(
      "href",
      "mailto:accessibility@archlucid.net",
    );
    expect(screen.getByTestId("accessibility-at-glance")).toBeInTheDocument();
    expect(screen.getByTestId("accessibility-revision-history")).toBeInTheDocument();
    expect(screen.getByText("Last reviewed: 2026-08-10")).toBeInTheDocument();
  });
});
