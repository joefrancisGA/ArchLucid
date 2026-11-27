import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ACCESSIBILITY_MARKETING_PRIMARY_CONTENT_ID } from "@/lib/accessibility-marketing-page-copy";
import { AccessibilityMarketingPublicView } from "./AccessibilityMarketingPublicView";

describe("AccessibilityMarketingPublicView working mode (AXX)", () => {
  it("exposes semantic main skip target and sources strip", () => {
    render(<AccessibilityMarketingPublicView lastReviewedLine={"Last reviewed: 2026-01-01"} />);

    expect(screen.getByTestId("accessibility-marketing-primary-content")).toHaveAttribute(
      "id",
      ACCESSIBILITY_MARKETING_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("accessibility-marketing-primary-content")).toHaveAttribute("tabIndex", "-1");
    expect(screen.getByTestId("accessibility-sources")).toBeInTheDocument();
  });
});
