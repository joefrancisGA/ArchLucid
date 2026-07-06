import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AccessibilityMarketingPublicView } from "@/components/marketing/AccessibilityMarketingPublicView";
import { parseLastReviewedLine, readAccessibilityPolicyMarkdown } from "@/lib/accessibility-marketing-policy";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "ArchLucid accessibility commitment, WCAG 2.1 Level AA target, and how to report accessibility barriers.",
};

export default function MarketingAccessibilityPage(): ReactNode {
  const markdown = readAccessibilityPolicyMarkdown();
  const lastReviewedLine = parseLastReviewedLine(markdown);

  return <AccessibilityMarketingPublicView lastReviewedLine={lastReviewedLine} />;
}
