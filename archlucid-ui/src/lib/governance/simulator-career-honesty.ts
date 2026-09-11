import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  FINDING_SEMANTIC_SUPPORT_BAND_LABELS,
  resolveDecisionGradeSemanticSupportBand,
  semanticSupportBandShortReason,
  semanticSupportBandStatusTagKind,
  type FindingSemanticSupportBandValue,
} from "@/lib/findings/semantic-support-band-presentation";
import {
  StructuralExecutionModeWire,
  type StructuralExecutionModeInput,
} from "@/lib/structural-execution-mode";
import {
  SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY,
  SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE,
} from "@/lib/simulator-mode-chrome-copy";

import type { CareerArtifactKind } from "@/lib/career-artifact/career-artifact-honesty";
import {
  DEFAULT_WORKING_CAREER_REHEARSAL_DOOR,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";

export const SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON =
  "Simulator rehearsal cannot be career-complete without explicit rehearsal labeling on the artifact.";

export const SIMULATOR_REHEARSAL_GUIDED_WARNING =
  "Simulator rehearsal — not production customer evidence.";

export const SIMULATOR_REHEARSAL_HEADER_TITLE = SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE;

export const SIMULATOR_REHEARSAL_HEADER_BODY = SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY;

export function isRehearsalStructuralExecutionMode(
  mode: StructuralExecutionModeInput,
): boolean {
  if (mode === StructuralExecutionModeWire.Simulator || mode === 0) {
    return true;
  }

  if (mode === StructuralExecutionModeWire.Fallback || mode === 2) {
    return true;
  }

  return false;
}

export function shouldBlockWorkingCareerForSimulatorRehearsal(input: {
  readonly workingDesk?: boolean;
  readonly isSample?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly simulatorRehearsalBannerOnArtifact?: boolean;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
}): boolean {
  if (input.workingDesk !== true) {
    return false;
  }

  if (input.isSample === true) {
    return false;
  }

  if (!isRehearsalStructuralExecutionMode(input.structuralExecutionMode ?? null)) {
    return false;
  }

  if (input.simulatorRehearsalBannerOnArtifact === true) {
    return false;
  }

  const effectiveDoor =
    input.effectiveWorkingCareerRehearsalDoor ?? DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;

  // CG-021 / LP-06: Rehearsal door may finalize as rehearsal-incomplete on Simulator/Fallback.
  if (effectiveDoor === "rehearsal") {
    return false;
  }

  return true;
}

export function formatSimulatorRehearsalCareerBlockedReason(input: {
  readonly workingDesk?: boolean;
  readonly isSample?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly simulatorRehearsalBannerOnArtifact?: boolean;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
  readonly artifactKind?: CareerArtifactKind;
}): string | null {
  if (!shouldBlockWorkingCareerForSimulatorRehearsal(input)) {
    return null;
  }

  return SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON;
}

export function shouldSuppressReadyToFinalizeForSimulatorRehearsal(input: {
  readonly workingDesk?: boolean;
  readonly isSample?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly simulatorRehearsalBannerOnArtifact?: boolean;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
}): boolean {
  return shouldBlockWorkingCareerForSimulatorRehearsal(input);
}

export const SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_LABEL =
  "Rehearsal — not career support";

export const SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_REASON =
  "Simulator rehearsal does not judge Real citation overlap for career surfaces.";

export type PresentedSemanticSupportBand = {
  readonly displayBand: FindingSemanticSupportBandValue;
  readonly label: string;
  readonly reason: string;
  readonly statusTagKind: EnterpriseStatusKind;
  readonly isRehearsalPresentation: boolean;
};

export function shouldPresentSemanticSupportBandAsRehearsal(
  structuralExecutionMode?: StructuralExecutionModeInput,
): boolean {
  return isRehearsalStructuralExecutionMode(structuralExecutionMode ?? null);
}

/** AS-068: Simulator must not show career-looking Supported chips from wire bands. */
export function presentDecisionGradeSemanticSupportBand(input: {
  readonly wireBand: unknown;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
}): PresentedSemanticSupportBand {
  const resolvedBand = resolveDecisionGradeSemanticSupportBand(input.wireBand);

  if (!shouldPresentSemanticSupportBandAsRehearsal(input.structuralExecutionMode)) {
    return {
      displayBand: resolvedBand,
      label: FINDING_SEMANTIC_SUPPORT_BAND_LABELS[resolvedBand],
      reason: semanticSupportBandShortReason(resolvedBand),
      statusTagKind: semanticSupportBandStatusTagKind(resolvedBand),
      isRehearsalPresentation: false,
    };
  }

  if (resolvedBand === "NotScored") {
    return {
      displayBand: "NotScored",
      label: FINDING_SEMANTIC_SUPPORT_BAND_LABELS.NotScored,
      reason: SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_REASON,
      statusTagKind: semanticSupportBandStatusTagKind("NotScored"),
      isRehearsalPresentation: true,
    };
  }

  return {
    displayBand: "NotScored",
    label: SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_LABEL,
    reason: SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_REASON,
    statusTagKind: "needs-attention",
    isRehearsalPresentation: true,
  };
}
