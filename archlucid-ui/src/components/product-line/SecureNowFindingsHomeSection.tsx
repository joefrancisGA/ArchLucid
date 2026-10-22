"use client";

import {
  SECURENOW_FINDINGS_HOME_ROWS,
} from "@/lib/product-line/securenow-security-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow Home — all findings in one destination group. */
export function SecureNowFindingsHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading="Findings"
      lead="What needs attention, and who owns it."
      rows={SECURENOW_FINDINGS_HOME_ROWS}
      sectionTestId="securenow-findings-home-section"
      headingId="securenow-findings-home-heading"
      tableAriaLabel="SecureNow findings destinations"
      linkTestIdPrefix="securenow-findings-home-link"
    />
  );
}
