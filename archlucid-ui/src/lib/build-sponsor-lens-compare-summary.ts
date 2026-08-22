import { buildCompareVerdictSummary } from "@/lib/build-compare-verdict-summary";
import type { CompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import type { CompareGovernanceDiffView } from "@/lib/compare-effective-governance-diff";
import type { GoldenManifestComparison } from "@/types/comparison";

export const SPONSOR_LENS_COMPARE_HEADING = "Sponsor lens";
export const SPONSOR_LENS_COMPARE_DISCLAIMER =
  "Plain-language notice for leadership — not ADR 0063 fingerprint truth. Use structured deltas and trust labels below for authoritative comparison.";

export const SPONSOR_LENS_INSUFFICIENT_DATA_MESSAGE =
  "Not enough comparison data to summarize for a sponsor yet — pick two finalized reviews with structured deltas, then compare again.";

export type SponsorLensCompareSummary = {
  readonly bullets: readonly string[];
  readonly insufficientData: boolean;
  readonly insufficientMessage: string | null;
};

const MAX_BULLETS = 3;

function pushBullet(bullets: string[], text: string): void {
  if (bullets.length >= MAX_BULLETS) {
    return;
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return;
  }

  bullets.push(trimmed);
}

/** TB-2178: at most three sponsor-comprehensible bullets from existing compare model — no new correlation logic. */
export function buildSponsorLensCompareSummary(input: {
  readonly golden: GoldenManifestComparison | null;
  readonly executionModeHonesty: CompareExecutionModeHonesty | null;
  readonly governanceDiff: CompareGovernanceDiffView | null;
}): SponsorLensCompareSummary {
  if (input.golden === null) {
    return {
      bullets: [],
      insufficientData: true,
      insufficientMessage: SPONSOR_LENS_INSUFFICIENT_DATA_MESSAGE,
    };
  }

  const verdict = buildCompareVerdictSummary(input.golden);
  const bullets: string[] = [];
  const findingDeltaCount = input.golden.securityChanges.length;
  const decisionDeltaCount = input.golden.decisionChanges.length;
  const governanceMaterialCount =
    input.governanceDiff?.materialComplianceRuleKeyChanges?.length ?? 0;
  const hasGovernanceDelta = input.governanceDiff?.hasManifestGovernanceDelta === true;

  if (findingDeltaCount > 0) {
    const direction =
      findingDeltaCount === 1
        ? "One finding or posture shift changed between reviews."
        : `${findingDeltaCount} finding or posture shifts changed between reviews.`;

    pushBullet(bullets, direction);
  } else if (verdict.totalChanges === 0) {
    pushBullet(bullets, "No material posture shifts detected — sponsor narrative can stay stable unless you add new evidence.");
  }

  if (decisionDeltaCount > 0) {
    pushBullet(
      bullets,
      decisionDeltaCount === 1
        ? "One architecture decision changed — confirm the disposition story before sponsor sign-off."
        : `${decisionDeltaCount} architecture decisions changed — review the decision delta table before sponsor sign-off.`,
    );
  }

  if (governanceMaterialCount > 0 || hasGovernanceDelta) {
    pushBullet(
      bullets,
      governanceMaterialCount > 0
        ? `${governanceMaterialCount} compliance rule key${governanceMaterialCount === 1 ? "" : "s"} differ — approval reviewers should scan the policy diff before export.`
        : "Governance metadata differs between reviews — confirm policy pack assignments before sharing the sponsor packet.",
    );
  }

  if (input.executionModeHonesty !== null && input.executionModeHonesty.modesDiffer) {
    pushBullet(
      bullets,
      "Execution modes differ between reviews — treat finding and cost movement as directional only in sponsor materials.",
    );
  } else if (input.executionModeHonesty !== null && input.executionModeHonesty.anyNonReal) {
    pushBullet(
      bullets,
      "At least one review used non-real execution — confirm per-finding trust labels before citing deltas to sponsors.",
    );
  }

  if (verdict.totalChanges > 0 && bullets.length === 0) {
    pushBullet(
      bullets,
      `${verdict.totalChanges} structured change${verdict.totalChanges === 1 ? "" : "s"} recorded — expand the technical comparison for architect detail.`,
    );
  }

  if (bullets.length === 0) {
    return {
      bullets: [],
      insufficientData: true,
      insufficientMessage: SPONSOR_LENS_INSUFFICIENT_DATA_MESSAGE,
    };
  }

  return {
    bullets: bullets.slice(0, MAX_BULLETS),
    insufficientData: false,
    insufficientMessage: null,
  };
}
