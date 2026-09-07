"use client";

import {
  SECURENOW_SECURITY_HOME_ROWS,
  SECURENOW_SECURITY_HOME_SECTION_HEADING,
  SECURENOW_SECURITY_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-security-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow home — operational security and integration destinations. */
export function SecureNowSecurityHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_SECURITY_HOME_SECTION_HEADING}
      lead={SECURENOW_SECURITY_HOME_SECTION_LEAD}
      rows={SECURENOW_SECURITY_HOME_ROWS}
      sectionTestId="securenow-security-home-section"
      headingId="securenow-security-home-heading"
      tableAriaLabel="SecureNow security operations destinations"
      linkTestIdPrefix="securenow-security-home-link"
    />
  );
}
