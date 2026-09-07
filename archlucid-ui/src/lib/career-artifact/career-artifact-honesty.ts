import {
  formatCareerExportClassificationBandLine,
  formatCareerExportHonestyPlainText,
  resolveCareerExportCoverageHonesty,
  type CareerExportCoverageHonestyInput,
} from "@/lib/career-export-coverage-honesty";
import { listSkippedMustQuestionKeys } from "@/lib/review-quality/list-skipped-must-question-keys";
import {
  ASSERTED_TRAIL_EMPTY_CAREER_CLAIM_REASON,
  isAssertedTransparencyTrailEmpty,
  isTransparencyTrailComplete,
  transparencyTrailIncompleteFinalizeReason,
} from "@/lib/feasibility/transparency-trail-completeness";
import { formatPreCommitGateDisabledCareerBlockedReason } from "@/lib/governance/pre-commit-gate-career-honesty";
import { countSkippedMustQuestions } from "@/lib/review-quality/count-skipped-must-questions";
import { resolveHardInfeasibleCitationExportBlockedReason } from "@/lib/feasibility/format-feasibility-verdict-markdown-section";
import { getDecisionGradeFindingProvenanceViolations } from "@/lib/findings/decision-grade-finding-provenance-validator";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type CareerArtifactKind = "finalize" | "export";

export type CareerArtifactHonestyInput = CareerExportCoverageHonestyInput & {
  readonly artifactKind: CareerArtifactKind;
  readonly transparencyTrail?: TransparencyTrail | null;
  /** Curated static demo / golden-path review — mirrors sponsor banner prop. */
  readonly curatedSampleRun?: boolean;
  /** When true, incomplete trail on a legacy sealed record yields warnings instead of blocks (ADR 0039). */
  readonly legacySealedReExport?: boolean;
  /** Block external sponsor distribution for demo/static/sample runs unless waiver copy is shown. */
  readonly blockExternalSponsorDistribution?: boolean;
};

export type CareerArtifactHonestyVerdict = {
  readonly canRender: boolean;
  readonly blockedReasons: readonly string[];
  readonly headerLines: readonly string[];
  readonly warnings: readonly string[];
};

const DEMO_SAMPLE_EXTERNAL_BLOCK_REASON =
  "Demo or sample data cannot be emailed as production proof without explicit waiver copy.";

const SAMPLE_WORKING_EXPORT_BLOCK_REASON =
  "Sample workspace — career export is blocked until you run a production review.";

const SKIPPED_MUST_FINALIZE_BLOCK_REASON =
  "Required intake questions are unanswered — resolve skipped MUST questions before sealing.";

function formatSkippedMustBlockedReason(skippedMustCount: number): string {
  if (skippedMustCount === 1) {
    return "1 required question is unanswered.";
  }

  return `${skippedMustCount} required questions are unanswered.`;
}

function resolveTrailBlockedReason(
  input: CareerArtifactHonestyInput,
): string | null {
  const manifestTrail = input.manifestSummary?.feasibilityVerdict?.transparencyTrail;
  const hasLoadedManifest = input.manifestSummary !== null && input.manifestSummary !== undefined;
  const hasExplicitTrail = input.transparencyTrail !== undefined;

  if (!hasExplicitTrail && !hasLoadedManifest) {
    return null;
  }

  const trail = input.transparencyTrail ?? manifestTrail ?? null;

  if (input.artifactKind === "finalize") {
    if (trail === null || trail === undefined) {
      return transparencyTrailIncompleteFinalizeReason(trail);
    }

    return null;
  }

  return transparencyTrailIncompleteFinalizeReason(trail);
}

function resolveSkippedMustBlockedReason(
  input: CareerArtifactHonestyInput,
): string | null {
  const trail = input.transparencyTrail ?? input.manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null;
  const skippedMustCount = countSkippedMustQuestions(trail);

  if (skippedMustCount <= 0) {
    return null;
  }

  if (input.artifactKind === "finalize") {
    return formatSkippedMustBlockedReason(skippedMustCount);
  }

  return SKIPPED_MUST_FINALIZE_BLOCK_REASON;
}

function resolveDemoSampleBlockedReason(input: CareerArtifactHonestyInput): string | null {
  if (input.blockExternalSponsorDistribution !== true) {
    return null;
  }

  if (input.isSample === true || input.curatedSampleRun === true) {
    return DEMO_SAMPLE_EXTERNAL_BLOCK_REASON;
  }

  return null;
}

function buildHeaderLines(input: CareerArtifactHonestyInput): readonly string[] {
  const lines: string[] = [];
  const plainHonesty = formatCareerExportHonestyPlainText(input).trim();

  if (plainHonesty.length > 0) {
    lines.push(...plainHonesty.split("\n").map((line) => line.trim()).filter((line) => line.length > 0));
  }

  const classificationLine = formatCareerExportClassificationBandLine(input.classificationCounts);

  if (classificationLine !== null && !lines.some((line) => line.includes("Decision-grade:"))) {
    lines.push(classificationLine);
  }

  const coverageHonesty = resolveCareerExportCoverageHonesty(input);

  if (coverageHonesty.measurementFloor.line.trim().length > 0 && !lines.some((line) => line.includes("Measured"))) {
    lines.push(coverageHonesty.measurementFloor.line.trim());
  }

  const trail = input.transparencyTrail ?? input.manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null;
  const skippedMustKeys = listSkippedMustQuestionKeys(trail);

  if (skippedMustKeys.length > 0) {
    const skippedMustLine = `Skipped required questions: ${skippedMustKeys.join(", ")}`;

    if (!lines.some((line) => line.startsWith("Skipped required questions:"))) {
      lines.push(skippedMustLine);
    }
  }

  if (
    input.workingDesk === true
    && isAssertedTransparencyTrailEmpty(trail)
    && !lines.some((line) => line.includes("No asserted intake recorded"))
  ) {
    lines.push(ASSERTED_TRAIL_EMPTY_CAREER_CLAIM_REASON);
  }

  return lines;
}

function buildLegacyTrailWarning(input: CareerArtifactHonestyInput): string | null {
  if (input.legacySealedReExport !== true) {
    return null;
  }

  const trail = input.transparencyTrail ?? input.manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null;

  if (isTransparencyTrailComplete(trail)) {
    return null;
  }

  return "This sealed record was finalized before transparency trail sections were required — treat exports as incomplete for career use.";
}

/** ADR 0078 — single Working entry for stamp, finalize, and career export honesty. */
export function evaluateCareerArtifactHonesty(
  input: CareerArtifactHonestyInput,
): CareerArtifactHonestyVerdict {
  const blockedReasons: string[] = [];
  const warnings: string[] = [];

  const trailBlockedReason = resolveTrailBlockedReason(input);

  if (trailBlockedReason !== null) {
    if (input.legacySealedReExport === true && input.artifactKind === "export") {
      const legacyWarning = buildLegacyTrailWarning(input);

      if (legacyWarning !== null) {
        warnings.push(legacyWarning);
      }
    } else {
      blockedReasons.push(trailBlockedReason);
    }
  }

  const skippedMustBlockedReason = resolveSkippedMustBlockedReason(input);

  if (skippedMustBlockedReason !== null) {
    blockedReasons.push(skippedMustBlockedReason);
  }

  if (input.artifactKind === "export") {
    const coverageHonesty = resolveCareerExportCoverageHonesty(input);

    if (
      coverageHonesty.blockedForWorkingCareerExport
      && coverageHonesty.measurementFloorBlockedReason !== null
    ) {
      blockedReasons.push(coverageHonesty.measurementFloorBlockedReason);
    }

    const hardCitationBlockedReason = resolveHardInfeasibleCitationExportBlockedReason(
      input.manifestSummary?.feasibilityVerdict ?? null,
    );

    if (hardCitationBlockedReason !== null) {
      blockedReasons.push(hardCitationBlockedReason);
    }

    if (input.workingDesk === true && input.findingsSnapshot !== undefined && input.findingsSnapshot !== null) {
      const provenanceViolations = getDecisionGradeFindingProvenanceViolations(input.findingsSnapshot);

      for (const violation of provenanceViolations) {
        blockedReasons.push(violation);
      }
    }
  }

  const preCommitBlockedReason = formatPreCommitGateDisabledCareerBlockedReason(input.preCommitGateEnabled);

  if (preCommitBlockedReason !== null && input.workingDesk === true && input.artifactKind === "finalize") {
    blockedReasons.push(preCommitBlockedReason);
  }

  const demoSampleBlockedReason = resolveDemoSampleBlockedReason(input);

  if (demoSampleBlockedReason !== null) {
    blockedReasons.push(demoSampleBlockedReason);
  }

  const trail = input.transparencyTrail ?? input.manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null;

  if (input.workingDesk === true && isAssertedTransparencyTrailEmpty(trail)) {
    if (input.artifactKind === "export") {
      blockedReasons.push(ASSERTED_TRAIL_EMPTY_CAREER_CLAIM_REASON);
    } else {
      warnings.push(ASSERTED_TRAIL_EMPTY_CAREER_CLAIM_REASON);
    }
  }

  if (input.isSample === true && input.artifactKind === "export") {

    if (input.workingDesk === true) {
      blockedReasons.push(SAMPLE_WORKING_EXPORT_BLOCK_REASON);
    } else {
      warnings.push("Sample workspace — not production customer evidence.");
    }
  }

  const headerLines = buildHeaderLines(input);
  const canRender = blockedReasons.length === 0;

  return {
    canRender,
    blockedReasons,
    headerLines,
    warnings,
  };
}
