import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstReviewGuideSupportPanel } from "@/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideSupportPanel";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";

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
});
