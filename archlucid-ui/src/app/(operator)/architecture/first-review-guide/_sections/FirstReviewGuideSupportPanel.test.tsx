import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstReviewGuideSupportPanel } from "@/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideSupportPanel";
import {
  FIRST_REVIEW_GUIDE_TEMPLATE_CHOOSE_ACTION,
  FIRST_REVIEW_GUIDE_TEMPLATE_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { REVIEWS_NEW_DETAILED_HREF } from "@/lib/reviews-new-path-copy";

describe("FirstReviewGuideSupportPanel", () => {
  it("does not render a Need help block", () => {
    render(<FirstReviewGuideSupportPanel />);

    expect(screen.queryByTestId("first-review-guide-help")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Need help?" })).not.toBeInTheDocument();
  });

  it("does not prescribe a specific template — links to templates and imports", () => {
    render(<FirstReviewGuideSupportPanel />);

    const templateCard = screen.getByTestId("first-review-guide-template-card");
    const visible = templateCard.textContent ?? "";

    expect(screen.getByRole("heading", { name: FIRST_REVIEW_GUIDE_TEMPLATE_LABEL })).toBeInTheDocument();
    expect(visible.toLowerCase()).not.toContain("enterprise customer intake");
    expect(visible.toLowerCase()).not.toContain("suggested starting point");

    const browseTemplates = within(templateCard).getByRole("link", { name: FIRST_REVIEW_GUIDE_TEMPLATE_CHOOSE_ACTION });
    expect(browseTemplates).toHaveAttribute("href", REVIEWS_NEW_DETAILED_HREF);
  });
});
