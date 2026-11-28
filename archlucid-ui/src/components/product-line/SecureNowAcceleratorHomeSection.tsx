"use client";

import {
  SECURENOW_ACCELERATOR_INDEX_HEADING,
  SECURENOW_ACCELERATOR_INDEX_LEAD,
} from "@/lib/product-line/securenow-accelerator-index-copy";
import { SECURENOW_ACCELERATOR_HOME_QUICK_ROWS } from "@/lib/product-line/securenow-accelerator-home-quick-rows";
import { SECURENOW_ACCELERATOR_RICHNESS_DISCIPLINE_LINE } from "@/lib/product-line/securenow-accelerator-richness-discipline-copy";
import { SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE } from "@/lib/product-line/securenow-synthetic-fixture-discipline";

import { SecureNowAcceleratorFamilyProgressStrip } from "@/components/product-line/SecureNowAcceleratorFamilyProgressStrip";
import { SecureNowAcceleratorPinnedQuickStrip } from "@/components/product-line/SecureNowAcceleratorPinnedQuickStrip";
import { SecureNowAcceleratorRecentOpensStrip } from "@/components/product-line/SecureNowAcceleratorRecentOpensStrip";
import { SecureNowAcceleratorResumeStrip } from "@/components/product-line/SecureNowAcceleratorResumeStrip";
import { SecureNowAcceleratorStarterPacksSection } from "@/components/product-line/SecureNowAcceleratorStarterPacksSection";
import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

export function SecureNowAcceleratorHomeSection(): React.JSX.Element {
  const lead = `${SECURENOW_ACCELERATOR_INDEX_LEAD} ${SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE} ${SECURENOW_ACCELERATOR_RICHNESS_DISCIPLINE_LINE}`;

  return (
    <div className="space-y-4" data-testid="securenow-accelerator-home-wave-b-host">
      <SecureNowAcceleratorResumeStrip />
      <SecureNowAcceleratorRecentOpensStrip />
      <SecureNowAcceleratorPinnedQuickStrip />
      <SecureNowAcceleratorFamilyProgressStrip />
      <SecureNowHomeDestinationSection
        heading={SECURENOW_ACCELERATOR_INDEX_HEADING}
        lead={lead}
        rows={SECURENOW_ACCELERATOR_HOME_QUICK_ROWS}
        sectionTestId="securenow-accelerator-home-section"
        headingId="securenow-accelerator-home-heading"
        tableAriaLabel="SecureNow accelerator home links"
        linkTestIdPrefix="securenow-accelerator-home-link"
      />
      <SecureNowAcceleratorStarterPacksSection />
    </div>
  );
}