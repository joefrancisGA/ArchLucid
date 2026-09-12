"use client";

import { useMemo } from "react";

import { InFlightAnalysisDeskList } from "@/components/operations/InFlightAnalysisDeskList";
import { useShellInFlightOperations } from "@/hooks/use-shell-in-flight-operations";
import { ARCHITECTURE_IDENTITY_DESK_IN_FLIGHT_HEADING } from "@/lib/architecture/architecture-identity-desk-copy";
import { buildSystemNotJobDeskInFlightDeskRows } from "@/lib/system-not-job-in-flight-review-on-desk";

type ArchitectureIdentityDeskInFlightSectionProps = {
  readonly architectureId: string;
};

/** Working architecture desk chip for in-flight review analysis (AO-21). */
export function ArchitectureIdentityDeskInFlightSection(
  props: ArchitectureIdentityDeskInFlightSectionProps,
): React.JSX.Element | null {
  const operations = useShellInFlightOperations();
  const rows = useMemo(
    () => buildSystemNotJobDeskInFlightDeskRows(operations, props.architectureId),
    [operations, props.architectureId],
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <InFlightAnalysisDeskList
      rows={rows}
      heading={ARCHITECTURE_IDENTITY_DESK_IN_FLIGHT_HEADING}
      headingId="architecture-identity-in-flight-heading"
      testId="architecture-identity-in-flight"
      rowLinkTestIdPrefix="architecture-identity-in-flight"
    />
  );
}
