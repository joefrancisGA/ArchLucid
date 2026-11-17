"use client";

import {
  SECURENOW_SCENARIO_HOME_ROWS,
  SECURENOW_SCENARIO_HOME_SECTION_HEADING,
  SECURENOW_SCENARIO_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-scenario-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

export function SecureNowScenarioHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_SCENARIO_HOME_SECTION_HEADING}
      lead={SECURENOW_SCENARIO_HOME_SECTION_LEAD}
      rows={SECURENOW_SCENARIO_HOME_ROWS}
      sectionTestId="securenow-scenario-home-section"
      headingId="securenow-scenario-home-heading"
      tableAriaLabel="SecureNow fixture walks"
      linkTestIdPrefix="securenow-scenario-home-link"
    />
  );
}
