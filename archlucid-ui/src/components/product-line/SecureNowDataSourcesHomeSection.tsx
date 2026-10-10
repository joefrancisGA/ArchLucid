"use client";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";
import { SECURENOW_DATA_SOURCES_HOME_ROWS } from "@/lib/product-line/securenow-data-sources-home-copy";

/** SecureNow Home — evidence collection and source configuration. */
export function SecureNowDataSourcesHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading="Data sources"
      lead="Where SecureNow's evidence comes from."
      rows={SECURENOW_DATA_SOURCES_HOME_ROWS}
      sectionTestId="securenow-data-sources-home-section"
      headingId="securenow-data-sources-home-heading"
      tableAriaLabel="SecureNow data source destinations"
      linkTestIdPrefix="securenow-data-sources-home-link"
    />
  );
}
