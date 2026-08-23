import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstReviewGuideSupportPanel } from "@/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideSupportPanel";
import {
  FIRST_REVIEW_GUIDE_TEMPLATE_CHOOSE_ACTION,
  FIRST_REVIEW_GUIDE_TEMPLATE_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { REVIEWS_NEW_DETAILED_HREF } from "@/lib/reviews-new-path-copy";

describe("FirstReviewGuideSupportPanel", () => {
  it("TB-1383: links help once with the canonical page title (no first-review FAQ label)", () => {
    render(<FirstReviewGuideSupportPanel />);

    const helpSection = screen.getByTestId("first-review-guide-help");
    const helpLinks = within(helpSection).getAllByRole("link", { name: FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE });

    expect(helpLinks).toHaveLength(1);
    expect(helpLinks[0]).toHaveAttribute("href", "/help/first-architecture-review");

    const visible = helpSection.textContent ?? "";

    expect(visible.toLowerCase()).not.toContain("first-review faq");
    expect(visible.toLowerCase()).not.toContain("first pilot path");
  });

  it("TB-2323: omits pairwise vocabulary strip — Need help already links to first architecture review help", () => {
    render(<FirstReviewGuideSupportPanel />);

    expect(
      screen.queryByTestId("first-review-guide-first-architecture-review-vocabulary"),
    ).not.toBeInTheDocument();
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
