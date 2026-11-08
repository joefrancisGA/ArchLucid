"use client";

import {
  SECURENOW_RETURN_HOME_ROWS,
  SECURENOW_RETURN_HOME_SECTION_HEADING,
  SECURENOW_RETURN_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-return-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow Home — existing work queues that can require a later return. */
export function SecureNowReturnHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_RETURN_HOME_SECTION_HEADING}
      lead={SECURENOW_RETURN_HOME_SECTION_LEAD}
      rows={SECURENOW_RETURN_HOME_ROWS}
      sectionTestId="securenow-return-home-section"
      headingId="securenow-return-home-heading"
      tableAriaLabel="SecureNow return reasons"
      linkTestIdPrefix="securenow-return-home-link"
    />
  );
}
