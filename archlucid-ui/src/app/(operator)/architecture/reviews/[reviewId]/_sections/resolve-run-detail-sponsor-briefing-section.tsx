import type { ReactElement } from "react";

import { resolveCareerArtifactExportHonestyDoorFields } from "@/lib/career-artifact/resolve-career-artifact-export-honesty-input";
import type { ManifestSummary, RunSummary } from "@/types/authority";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

import { RunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";

export type RunDetailSponsorBriefingSectionOptions = {
  readonly pagePrimaryOwnedElsewhere?: boolean;
  readonly enginesSucceeded?: number | null;
  readonly manifestSummary?: ManifestSummary | null;
  readonly progressSummary?: RunSummary | null;
  readonly graphSnapshot?: unknown;
  readonly preCommitGateEnabled?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
};

/** Inputs already on the first-screen run-detail model — no below-fold deferred fetch required. */
export type RunDetailSponsorBriefingModelSlice = {
  readonly showPilotScorecardPackageCta: boolean;
  readonly manifestId: string | null | undefined;
  readonly routeRunId: string;
  readonly usedStaticDemoRun: boolean;
  readonly buyerPolishedArtifactTable: boolean;
  readonly artifacts: readonly { readonly artifactId?: string | null }[];
};

/**
 * Time-to-Value / sponsor PDF CTA. Kept outside {@link RunDetailBelowFoldSections}' deferred await
 * so `#sponsor-handoff-extended` mounts when the Review package tab opens even if pipeline timeline fetch is slow.
 *
 * Lives in a server-safe module so RSC run-detail views can render the client section without
 * invoking a `"use client"` function (Next.js forbids calling client exports from the server).
 */
export function resolveRunDetailSponsorBriefingSection(
  model: RunDetailSponsorBriefingModelSlice,
  options?: RunDetailSponsorBriefingSectionOptions,
): ReactElement | null {
  const manifestId = model.manifestId?.trim() ?? "";

  if (!model.showPilotScorecardPackageCta || manifestId.length === 0) {
    return null;
  }

  return (
    <RunDetailSponsorBriefingSection
      runId={model.routeRunId}
      manifestId={manifestId}
      curatedSampleRun={model.usedStaticDemoRun}
      buyerPolishedArtifactTable={model.buyerPolishedArtifactTable}
      sponsorDocxAvailable={manifestId.length > 0}
      pagePrimaryOwnedElsewhere={options?.pagePrimaryOwnedElsewhere}
      careerArtifactHonesty={
        options?.progressSummary !== undefined
        || options?.manifestSummary !== undefined
        || options?.graphSnapshot !== undefined
        || options?.enginesSucceeded !== undefined
          ? {
              progressSummary: options?.progressSummary ?? null,
              manifestSummary: options?.manifestSummary ?? null,
              graphSnapshot: options?.graphSnapshot ?? null,
              enginesSucceeded: options?.enginesSucceeded ?? null,
              workingDesk: true,
              preCommitGateEnabled: options?.preCommitGateEnabled,
              isSample: model.usedStaticDemoRun,
              ...resolveCareerArtifactExportHonestyDoorFields({
                progressSummary: options?.progressSummary ?? null,
                structuralExecutionMode: options?.structuralExecutionMode,
                workingCareerRehearsalDoor: options?.workingCareerRehearsalDoor,
              }),
            }
          : undefined
      }
    />
  );
}
