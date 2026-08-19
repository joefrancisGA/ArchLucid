"use client";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Progressive disclosure for dashboard prerequisites — keeps the hero calm for sponsor readers. */
export function SponsorDashboardHowItWorks(): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;

  return (
    <CollapsibleSection
      title={v.howItWorksSectionTitle}
      sectionTestId="sponsor-dashboard-how-it-works"
      summaryId="sponsor-dashboard-how-it-works-summary"
    >
      <p className={`m-0 text-al-text-secondary ${OPERATOR_TYPOGRAPHY.body}`}>{v.howItWorksDescription}</p>
      <p className="m-0 mt-3">
        <Link
          href={v.portfolioPageLearnMoreHref}
          className={OPERATOR_LINK.inline}
          data-testid="sponsor-dashboard-how-it-works-guide"
        >
          {v.portfolioPageLearnMoreLabel}
        </Link>
      </p>
    </CollapsibleSection>
  );
}
