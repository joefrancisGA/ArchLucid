"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { SponsorExportSendHonestyStrip } from "@/components/exports/SponsorExportSendHonestyStrip";
import { RunScopedAuditExportButton } from "@/components/runs/RunScopedAuditExportButton";
import { ExportDeliverableDialog } from "@/components/usability/ExportDeliverableDialog";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

export type RunDetailPackageSpineExportCoLocationStripProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly progressSummary?: RunSummary | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
  readonly liveDoor?: WorkingCareerRehearsalDoorId | null;
  readonly enginesSucceeded?: number | null;
};

/** TB-1030 package spine: finalize and sponsor export affordances stay on the same viewport band. */
export function RunDetailPackageSpineExportCoLocationStrip(
  props: RunDetailPackageSpineExportCoLocationStripProps,
): ReactElement {
  const manifestId = props.manifestId.trim();

  if (manifestId.length === 0) {
    return <></>;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.infoShell, "mb-3 flex-col gap-2")}
      data-testid="run-detail-package-spine-export-co-location"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Review finalized — sponsor exports are ready here without leaving the package spine.
      </p>
      <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
        <ExportDeliverableDialog runId={props.runId} manifestId={manifestId} />
        <RunScopedAuditExportButton
          runId={props.runId}
          manifestVersion={manifestId}
          progressSummary={props.progressSummary ?? null}
          structuralExecutionMode={props.structuralExecutionMode}
          workingCareerRehearsalDoor={props.workingCareerRehearsalDoor}
          liveDoor={props.liveDoor}
          enginesSucceeded={props.enginesSucceeded ?? null}
        />
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="#artifacts-exports" data-testid="run-detail-package-spine-all-deliverables-link">
            All deliverables
          </Link>
        </Button>
      </div>

      <SponsorExportSendHonestyStrip className="mt-3" testIdPrefix="run-detail-package-spine-export" />
    </div>
  );
}
