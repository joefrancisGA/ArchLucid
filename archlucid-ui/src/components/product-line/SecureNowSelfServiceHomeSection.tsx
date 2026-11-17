"use client";

import {
  SECURENOW_SELF_SERVICE_HOME_ROWS,
  SECURENOW_SELF_SERVICE_HOME_SECTION_HEADING,
  SECURENOW_SELF_SERVICE_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-self-service-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

export function SecureNowSelfServiceHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_SELF_SERVICE_HOME_SECTION_HEADING}
      lead={SECURENOW_SELF_SERVICE_HOME_SECTION_LEAD}
      rows={SECURENOW_SELF_SERVICE_HOME_ROWS}
      sectionTestId="securenow-self-service-home-section"
      headingId="securenow-self-service-home-heading"
      tableAriaLabel="SecureNow stuck-state checks"
      linkTestIdPrefix="securenow-self-service-home-link"
    />
  );
}
