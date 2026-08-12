import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorPilotOrientationBanner } from "@/components/OperatorPilotOrientationBanner";
import {
  FIRST_ARCHITECTURE_REVIEW_ORIENTATION_BODY,
  FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE,
} from "@/lib/first-architecture-review-help-copy";
import { getHelpCenterDisplay, getHelpCenterTier } from "@/lib/help/help-center-catalog";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("OperatorPilotOrientationBanner", () => {
  it("links the walkthrough to Your first architecture review help once (TB-1380)", () => {
    render(<OperatorPilotOrientationBanner />);

    expect(screen.getByRole("heading", { name: FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(FIRST_ARCHITECTURE_REVIEW_ORIENTATION_BODY)).toBeInTheDocument();
    expect(screen.getByTestId("operator-pilot-secondary-first-run")).toHaveAttribute(
      "href",
      "/help/first-architecture-review",
    );
    expect(screen.queryByTestId("operator-pilot-secondary-help")).toBeNull();
    expect(screen.getByTestId("operator-pilot-secondary-reviews")).toHaveAttribute("href", "/architecture/reviews");

    const visible = document.body.textContent ?? "";

    expect(visible.toLowerCase()).not.toContain("first pilot path");
    expect(visible.toLowerCase()).not.toContain("commit the package");
    expect(visible.toLowerCase()).not.toContain("finalize the package");
  });

  it("matches registry and help-center title honesty (TB-1380)", () => {
    const entry = getProductDocumentationEntry("first-architecture-review");

    expect(entry?.title).toBe(FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE);
    expect(getHelpCenterDisplay(entry!).title).toBe(FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE);
    expect(getHelpCenterTier(entry!)).toBe("product");
  });
});
