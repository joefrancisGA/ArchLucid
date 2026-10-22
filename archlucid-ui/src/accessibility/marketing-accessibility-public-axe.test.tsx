import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";

import { AccessibilityMarketingPublicView } from "@/components/marketing/AccessibilityMarketingPublicView";
import { parseLastReviewedLine, readAccessibilityPolicyMarkdown } from "@/lib/accessibility-marketing-policy";

const ACCESSIBILITY_PUBLIC_FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /playwright/i,
  /axe-core/i,
  /@axe-core\/playwright/i,
  /npm run/i,
  /layout\.tsx/i,
  /globals\.css/i,
  /SidebarNav/i,
  /eslint-plugin-jsx-a11y/i,
  /live-api-accessibility/i,
  /PAGES_DEFERRED/i,
  /legacy aliases/i,
  /archlucid-ui\/e2e/i,
  /docs\/quality\//i,
];

expect.extend(toHaveNoViolations);

describe("marketing /accessibility public view — axe (Vitest)", () => {
  it("AccessibilityMarketingPublicView has no serious axe violations", async () => {
    const markdown = readAccessibilityPolicyMarkdown();
    const lastReviewedLine = parseLastReviewedLine(markdown);

    const { container } = render(<AccessibilityMarketingPublicView lastReviewedLine={lastReviewedLine} />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not expose engineering-only accessibility implementation details", () => {
    const markdown = readAccessibilityPolicyMarkdown();
    const lastReviewedLine = parseLastReviewedLine(markdown);
    const { container } = render(<AccessibilityMarketingPublicView lastReviewedLine={lastReviewedLine} />);
    const text = container.textContent ?? "";

    for (const pattern of ACCESSIBILITY_PUBLIC_FORBIDDEN_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });
});
