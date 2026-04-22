import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";

import { AccessibilityMarketingPublicView } from "@/components/marketing/AccessibilityMarketingPublicView";
import {
  parseLastReviewedLine,
  readAccessibilityPolicyMarkdown,
  requireAccessibilityMarketingSections,
} from "@/lib/accessibility-marketing-policy";

expect.extend(toHaveNoViolations);

describe("marketing /accessibility public view — axe (Vitest)", () => {
  it("AccessibilityMarketingPublicView has no serious axe violations", async () => {
    const markdown = readAccessibilityPolicyMarkdown();
    const sections = requireAccessibilityMarketingSections(markdown);
    const lastReviewedLine = parseLastReviewedLine(markdown);

    const { container } = render(
      <AccessibilityMarketingPublicView sections={sections} lastReviewedLine={lastReviewedLine} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
