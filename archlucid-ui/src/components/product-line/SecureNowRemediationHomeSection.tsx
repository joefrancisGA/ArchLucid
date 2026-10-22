"use client";

import { SECURENOW_REMEDIATION_HOME_ROWS } from "@/lib/product-line/securenow-security-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow Home — prioritized remediation work. */
export function SecureNowRemediationHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading="Remediation"
      lead="What to fix first, and whether it worked."
      rows={SECURENOW_REMEDIATION_HOME_ROWS}
      sectionTestId="securenow-remediation-home-section"
      headingId="securenow-remediation-home-heading"
      tableAriaLabel="SecureNow remediation destinations"
      linkTestIdPrefix="securenow-remediation-home-link"
    />
  );
}
