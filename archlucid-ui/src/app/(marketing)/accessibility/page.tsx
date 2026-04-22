import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AccessibilityMarketingPublicView } from "@/components/marketing/AccessibilityMarketingPublicView";
import {
  parseLastReviewedLine,
  readAccessibilityPolicyMarkdown,
  requireAccessibilityMarketingSections,
} from "@/lib/accessibility-marketing-policy";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "WCAG 2.1 AA self-attestation, tooling, and reporting for ArchLucid.",
};

export default function MarketingAccessibilityPage(): ReactNode {
  const markdown = readAccessibilityPolicyMarkdown();
  const sections = requireAccessibilityMarketingSections(markdown);
  const lastReviewedLine = parseLastReviewedLine(markdown);

  return <AccessibilityMarketingPublicView sections={sections} lastReviewedLine={lastReviewedLine} />;
}
