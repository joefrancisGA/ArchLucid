"use client";

import { useMemo } from "react";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";
import { useSecureNowLatestSucceededSnapshotId } from "@/hooks/use-securenow-latest-succeeded-snapshot-id";
import { buildSecureNowFirstHourHomeRows } from "@/lib/product-line/build-securenow-first-hour-home-rows";
import {
  SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING,
  SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-first-hour-home-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** SecureNow Home — first-hour path before verification or sponsor packaging. */
export function SecureNowFirstHourHomeSection(): React.JSX.Element {
  const snapshotQuery = useSecureNowLatestSucceededSnapshotId();
  const rows = useMemo(
    () => buildSecureNowFirstHourHomeRows({ latestSnapshotId: snapshotQuery.latestSnapshotId }),
    [snapshotQuery.latestSnapshotId],
  );

  return (
  <div className="space-y-2">
    {snapshotQuery.isPending ? (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-first-hour-home-loading">
        Loading capture status…
      </p>
    ) : null}
    <SecureNowHomeDestinationSection
      heading={SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING}
      lead={SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD}
      rows={rows}
      sectionTestId="securenow-first-hour-home-section"
      headingId="securenow-first-hour-home-heading"
      tableAriaLabel="SecureNow first hour path"
      linkTestIdPrefix="securenow-first-hour-home-link"
    />
  </div>
  );
}
