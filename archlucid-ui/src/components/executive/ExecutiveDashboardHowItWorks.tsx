"use client";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Progressive disclosure for dashboard prerequisites — keeps the hero calm for executive readers. */
export function ExecutiveDashboardHowItWorks(): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <CollapsibleSection
      title={v.howItWorksSectionTitle}
      sectionTestId="executive-dashboard-how-it-works"
      summaryId="executive-dashboard-how-it-works-summary"
    >
      <p className={`m-0 text-al-text-secondary ${OPERATOR_TYPOGRAPHY.body}`}>{v.howItWorksDescription}</p>
      <p className="m-0 mt-3">
        <Link
          href={v.portfolioPageLearnMoreHref}
          className={OPERATOR_LINK.inline}
          data-testid="executive-dashboard-how-it-works-guide"
        >
          {v.portfolioPageLearnMoreLabel}
        </Link>
      </p>
    </CollapsibleSection>
  );
}
