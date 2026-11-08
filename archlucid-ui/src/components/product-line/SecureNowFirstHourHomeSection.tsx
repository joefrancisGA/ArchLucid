"use client";

import {
  SECURENOW_FIRST_HOUR_HOME_ROWS,
  SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING,
  SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-first-hour-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow Home — first-hour path before verification or sponsor packaging. */
export function SecureNowFirstHourHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING}
      lead={SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD}
      rows={SECURENOW_FIRST_HOUR_HOME_ROWS}
      sectionTestId="securenow-first-hour-home-section"
      headingId="securenow-first-hour-home-heading"
      tableAriaLabel="SecureNow first hour path"
      linkTestIdPrefix="securenow-first-hour-home-link"
    />
  );
}
