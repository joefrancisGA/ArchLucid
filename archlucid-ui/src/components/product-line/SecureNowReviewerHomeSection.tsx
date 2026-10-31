"use client";

import {
  SECURENOW_REVIEWER_HOME_ROWS,
  SECURENOW_REVIEWER_HOME_SECTION_HEADING,
  SECURENOW_REVIEWER_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-reviewer-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow Home — internal reviewer and conversation links (not marketing nav). */
export function SecureNowReviewerHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_REVIEWER_HOME_SECTION_HEADING}
      lead={SECURENOW_REVIEWER_HOME_SECTION_LEAD}
      rows={SECURENOW_REVIEWER_HOME_ROWS}
      sectionTestId="securenow-reviewer-home-section"
      headingId="securenow-reviewer-home-heading"
      tableAriaLabel="SecureNow reviewer destinations"
      linkTestIdPrefix="securenow-reviewer-home-link"
    />
  );
}
