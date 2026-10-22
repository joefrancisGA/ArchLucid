"use client";

import { useMemo } from "react";

import { InFlightAnalysisDeskList } from "@/components/operations/InFlightAnalysisDeskList";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useSessionAiReadiness } from "@/hooks/session-ai-readiness-context";
import { useShellInFlightOperations } from "@/hooks/use-shell-in-flight-operations";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import { ARCHITECTURE_IDENTITY_DESK_IN_FLIGHT_HEADING } from "@/lib/architecture/architecture-identity-desk-copy";
import {
  INHABIT_IN_FLIGHT_DESK_CHIP_DETAIL_LINE,
  resolveInhabitInFlightDeskChipStamp,
} from "@/lib/inhabit/inhabit-in-flight-desk-chip-presentation";
import { buildSystemNotJobDeskInFlightDeskRows } from "@/lib/system-not-job-in-flight-review-on-desk";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

type ArchitectureIdentityDeskInFlightSectionProps = {
  readonly architectureId: string;
};

/** Working architecture desk chip for in-flight review analysis (AO-21 / IH-031). */
export function ArchitectureIdentityDeskInFlightSection(
  props: ArchitectureIdentityDeskInFlightSectionProps,
): React.JSX.Element | null {
  const operations = useShellInFlightOperations();
  const { mode, mounted: workspaceMounted } = useWorkspaceMode();
  const { door, mounted: doorMounted } = useWorkingCareerRehearsalDoor();
  const readiness = useSessionAiReadiness();
  const rows = useMemo(
    () => buildSystemNotJobDeskInFlightDeskRows(operations, props.architectureId),
    [operations, props.architectureId],
  );

  if (rows.length === 0) {
    return null;
  }

  const workingMode = workspaceMounted && isWorkingWorkspaceMode(mode);
  const modeStampLabel =
    workingMode && doorMounted
      ? resolveInhabitInFlightDeskChipStamp({
          workingMode: true,
          door,
          isSessionReal: readiness.isSessionReal,
        })
      : null;

  return (
    <InFlightAnalysisDeskList
      rows={rows}
      heading={ARCHITECTURE_IDENTITY_DESK_IN_FLIGHT_HEADING}
      headingId="architecture-identity-in-flight-heading"
      testId="architecture-identity-in-flight"
      rowLinkTestIdPrefix="architecture-identity-in-flight"
      modeStampLabel={modeStampLabel}
      detailLineOverride={workingMode ? INHABIT_IN_FLIGHT_DESK_CHIP_DETAIL_LINE : null}
    />
  );
}
