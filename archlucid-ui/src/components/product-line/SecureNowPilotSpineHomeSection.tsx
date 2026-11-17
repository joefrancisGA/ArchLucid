"use client";

import {
  SECURENOW_PILOT_SPINE_HOME_ROWS,
  SECURENOW_PILOT_SPINE_HOME_SECTION_HEADING,
  SECURENOW_PILOT_SPINE_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-pilot-spine-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow Home — fixture pilot spine accelerator. */
export function SecureNowPilotSpineHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_PILOT_SPINE_HOME_SECTION_HEADING}
      lead={SECURENOW_PILOT_SPINE_HOME_SECTION_LEAD}
      rows={SECURENOW_PILOT_SPINE_HOME_ROWS}
      sectionTestId="securenow-pilot-spine-home-section"
      headingId="securenow-pilot-spine-home-heading"
      tableAriaLabel="SecureNow pilot walkthrough accelerators"
      linkTestIdPrefix="securenow-pilot-spine-home-link"
    />
  );
}
