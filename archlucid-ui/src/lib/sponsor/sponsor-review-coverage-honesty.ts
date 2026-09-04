import { analysisStagesCompleteOnSummary } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/pipeline-complete-on-summary";
import { isExportableDecisionVerdict } from "@/lib/decision-receipt-export";
import { ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_BODY } from "@/lib/findings/actor-dependent-findings-quiet-engines-recovery";
import { feasibilityVerdictKindLabel } from "@/lib/feasibility-verdict-display";
import { formatTransparencyTrailMarkdownSection } from "@/lib/feasibility/export-transparency-trail-section";
import { countActorNodesInGraphSnapshot } from "@/lib/graph-snapshot-actor-count";
import { listSkippedMustQuestionKeys } from "@/lib/review-quality/list-skipped-must-question-keys";
import type { RunSummary } from "@/types/authority";
import type { ManifestSummary } from "@/types/authority-manifest";

export type SponsorReviewCoverageHonestyInputs = {
  readonly runId: string;
  readonly progressSummary: RunSummary | null | undefined;
  readonly manifestSummary: ManifestSummary | null | undefined;
  readonly graphSnapshot: unknown;
};

export function sponsorReviewCoverageHonestyApplies(
  inputs: SponsorReviewCoverageHonestyInputs,
): boolean {
  const verdict = inputs.manifestSummary?.feasibilityVerdict;

  if (verdict !== null && verdict !== undefined && isExportableDecisionVerdict(verdict.kind)) {
    return true;
  }

  const actorNodeCount = countActorNodesInGraphSnapshot(inputs.graphSnapshot);
  const showQuietEngines =
    analysisStagesCompleteOnSummary(inputs.progressSummary ?? null) && actorNodeCount === 0;
  const skippedMustKeys = listSkippedMustQuestionKeys(
    inputs.manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null,
  );

  return showQuietEngines || skippedMustKeys.length > 0;
}

/** One-sentence sponsor export honesty — reuse trail / quiet-engine / infeasible copy (WA-08). */
export function formatSponsorReviewCoverageHonestyMarkdown(
  inputs: SponsorReviewCoverageHonestyInputs,
): string {
  if (!sponsorReviewCoverageHonestyApplies(inputs)) {
    return "";
  }

  const lines: string[] = [];
  const reviewHref = `/architecture/reviews/${encodeURIComponent(inputs.runId.trim())}`;
  const verdict = inputs.manifestSummary?.feasibilityVerdict;

  lines.push("## Architecture package honesty");
  lines.push("");
  lines.push(
    `> Sponsor KPIs for review \`${inputs.runId.trim()}\` are **not** an all-clear bill of health. Open the [architecture package](${reviewHref}) before steering or procurement use.`,
  );
  lines.push("");

  if (verdict !== null && verdict !== undefined && isExportableDecisionVerdict(verdict.kind)) {
    lines.push(
      `- **Feasibility verdict:** ${feasibilityVerdictKindLabel(verdict.kind)} — treat exports as a reasoned decision record, not approval to proceed.`,
    );
  }

  const actorNodeCount = countActorNodesInGraphSnapshot(inputs.graphSnapshot);

  if (analysisStagesCompleteOnSummary(inputs.progressSummary ?? null) && actorNodeCount === 0) {
    lines.push(`- **Coverage:** ${ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_BODY}`);
  }

  const skippedMustKeys = listSkippedMustQuestionKeys(verdict?.transparencyTrail ?? null);

  if (skippedMustKeys.length > 0) {
    lines.push(`- **Skipped required questions:** ${skippedMustKeys.join(", ")}`);
  }

  const trailSection = formatTransparencyTrailMarkdownSection(verdict?.transparencyTrail ?? null);

  if (trailSection.length > 0) {
    lines.push(trailSection);
  }

  return lines.join("\n");
}
