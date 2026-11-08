"use client";

import {
  SECURENOW_SPONSOR_HOME_ROWS,
  SECURENOW_SPONSOR_HOME_SECTION_HEADING,
  SECURENOW_SPONSOR_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-sponsor-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow Home — internal sponsor readout preparation links. */
export function SecureNowSponsorHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_SPONSOR_HOME_SECTION_HEADING}
      lead={SECURENOW_SPONSOR_HOME_SECTION_LEAD}
      rows={SECURENOW_SPONSOR_HOME_ROWS}
      sectionTestId="securenow-sponsor-home-section"
      headingId="securenow-sponsor-home-heading"
      tableAriaLabel="SecureNow sponsor destinations"
      linkTestIdPrefix="securenow-sponsor-home-link"
    />
  );
}
