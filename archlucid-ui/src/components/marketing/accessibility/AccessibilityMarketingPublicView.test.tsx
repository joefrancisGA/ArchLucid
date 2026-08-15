import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessibilityMarketingPublicView } from "@/components/marketing/AccessibilityMarketingPublicView";

describe("AccessibilityMarketingPublicView", () => {
  it("exposes skip link, report CTA, and at-a-glance before detailed sections", () => {
    render(<AccessibilityMarketingPublicView lastReviewedLine="Last reviewed: 2026-08-10" />);

    expect(screen.getByRole("link", { name: "Skip to accessibility statement" })).toHaveAttribute(
      "href",
      "#accessibility-main-content",
    );
    expect(screen.getByTestId("accessibility-report-issue-cta")).toHaveAttribute(
      "href",
      "mailto:accessibility@archlucid.net",
    );
    expect(screen.getByTestId("accessibility-at-glance")).toBeInTheDocument();
    expect(screen.getByTestId("accessibility-revision-history")).toBeInTheDocument();
    expect(screen.getByText("Last reviewed: 2026-08-10")).toBeInTheDocument();
  });
});
