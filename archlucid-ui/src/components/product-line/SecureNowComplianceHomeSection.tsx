"use client";

import {
  SECURENOW_COMPLIANCE_HOME_ROWS,
  SECURENOW_COMPLIANCE_HOME_SECTION_HEADING,
  SECURENOW_COMPLIANCE_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-compliance-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow home — compliance posture destinations including ARC-AMPE policy packs. */
export function SecureNowComplianceHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_COMPLIANCE_HOME_SECTION_HEADING}
      lead={SECURENOW_COMPLIANCE_HOME_SECTION_LEAD}
      rows={SECURENOW_COMPLIANCE_HOME_ROWS}
      sectionTestId="securenow-compliance-home-section"
      headingId="securenow-compliance-home-heading"
      tableAriaLabel="SecureNow compliance posture destinations"
      linkTestIdPrefix="securenow-compliance-home-link"
    />
  );
}
