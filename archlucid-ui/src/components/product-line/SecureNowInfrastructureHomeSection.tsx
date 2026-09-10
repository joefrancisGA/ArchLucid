"use client";

import {
  SECURENOW_INFRASTRUCTURE_HOME_ROWS,
  SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING,
  SECURENOW_INFRASTRUCTURE_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-infrastructure-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow home — infrastructure evidence workbench destinations. */
export function SecureNowInfrastructureHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING}
      lead={SECURENOW_INFRASTRUCTURE_HOME_SECTION_LEAD}
      rows={SECURENOW_INFRASTRUCTURE_HOME_ROWS}
      sectionTestId="securenow-infrastructure-home-section"
      headingId="securenow-infrastructure-home-heading"
      tableAriaLabel="SecureNow infrastructure evidence workbenches"
      linkTestIdPrefix="securenow-infrastructure-home-link"
    />
  );
}
