"use client";

import {
  SECURENOW_ACCELERATOR_INDEX_PATH,
  SECURENOW_ACCELERATOR_INDEX_HEADING,
  SECURENOW_ACCELERATOR_INDEX_LEAD,
} from "@/lib/product-line/securenow-accelerator-index-copy";
import { SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE } from "@/lib/product-line/securenow-synthetic-fixture-discipline";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

const ROWS = [
  {
    href: SECURENOW_ACCELERATOR_INDEX_PATH,
    label: "Open accelerator index",
    summary: "Pilot spine, readout pack, reviewer packet, scenario walks, and collection setup — all labeled fixture.",
    recommendedFirst: true,
  },
] as const;

export function SecureNowAcceleratorHomeSection(): React.JSX.Element {
  const lead = `${SECURENOW_ACCELERATOR_INDEX_LEAD} ${SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE}`;

  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_ACCELERATOR_INDEX_HEADING}
      lead={lead}
      rows={ROWS}
      sectionTestId="securenow-accelerator-home-section"
      headingId="securenow-accelerator-home-heading"
      tableAriaLabel="SecureNow accelerator home link"
      linkTestIdPrefix="securenow-accelerator-home-link"
    />
  );
}
