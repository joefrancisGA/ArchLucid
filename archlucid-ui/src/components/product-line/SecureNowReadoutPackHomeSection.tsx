"use client";

import {
  SECURENOW_READOUT_PACK_HOME_ROWS,
  SECURENOW_READOUT_PACK_HOME_SECTION_HEADING,
  SECURENOW_READOUT_PACK_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-readout-pack-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

/** SecureNow Home — fixture readout pack accelerator. */
export function SecureNowReadoutPackHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_READOUT_PACK_HOME_SECTION_HEADING}
      lead={SECURENOW_READOUT_PACK_HOME_SECTION_LEAD}
      rows={SECURENOW_READOUT_PACK_HOME_ROWS}
      sectionTestId="securenow-readout-pack-home-section"
      headingId="securenow-readout-pack-home-heading"
      tableAriaLabel="SecureNow readout pack accelerators"
      linkTestIdPrefix="securenow-readout-pack-home-link"
    />
  );
}
