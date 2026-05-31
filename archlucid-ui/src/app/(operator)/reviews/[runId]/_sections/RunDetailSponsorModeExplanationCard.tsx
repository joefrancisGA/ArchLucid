import type { ReactElement } from "react";

import { ExplanationEvidenceBasisBadges } from "@/components/ExplanationEvidenceBasisBadges";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { severityBadgeLabel } from "@/lib/quick-decision-summary-derive";
import type { RunExplanationSummary } from "@/types/explanation";
import { isDeterministicExplanationFallback, normalizeFiniteRatio } from "@/types/explanation";

type RunDetailSponsorModeExplanationCardProps = {
  readonly explanationSummary: RunExplanationSummary | null;
  readonly findings: readonly QuickDecisionFinding[];
  readonly buyerPolishedArtifactTable: boolean;
};

function firstNonEmptyLine(value: string | null | undefined): string {
  const text = value?.trim() ?? "";

  if (text.length === 0) {
    return "This committed review is ready for sponsor discussion, but the narrative summary is not available yet.";
  }

  return text.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? text;
}

function topFindings(findings: readonly QuickDecisionFinding[]): readonly QuickDecisionFinding[] {
  return [...findings]
    .filter((finding) => !finding.isMuted)
    .sort((a, b) => {
      const severityDelta = b.severityValue - a.severityValue;

      if (severityDelta !== 0) {
        return severityDelta;
      }

      return a.findingOrder - b.findingOrder;
    })
    .slice(0, 3);
}

export function RunDetailSponsorModeExplanationCard(
  props: RunDetailSponsorModeExplanationCardProps,
): ReactElement | null {
  const { explanationSummary, findings, buyerPolishedArtifactTable } = props;
  const top = topFindings(findings);

  if (explanationSummary === null && top.length === 0) {
    return null;
  }

  const citationCount = explanationSummary?.citations?.length ?? 0;
  const faithfulnessRatio = normalizeFiniteRatio(explanationSummary?.faithfulnessSupportRatio);
  const basisLabel =
    citationCount > 0
      ? `${citationCount} persisted citation${citationCount === 1 ? "" : "s"}`
      : "committed manifest and finding records";

  return (
    <section
      className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-4 text-sm"
      data-testid="sponsor-mode-explanation-card"
      aria-labelledby="sponsor-mode-explanation-heading"
    >
      <header className="space-y-1">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200">
          Sponsor-mode explanation
        </p>
        <h3 id="sponsor-mode-explanation-heading" className="m-0 text-sm font-semibold text-al-text-primary">
          Explain this review like I am the sponsor
        </h3>
      </header>

      <p className="mt-3 m-0 text-teal-900 dark:text-teal-100">
        {firstNonEmptyLine(explanationSummary?.overallAssessment ?? explanationSummary?.explanation?.summary)}
      </p>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-2">
          <dt className="font-semibold">Evidence basis</dt>
          <dd className="m-0 mt-1">{basisLabel}</dd>
        </div>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-2">
          <dt className="font-semibold">Risk posture</dt>
          <dd className="m-0 mt-1">{explanationSummary?.riskPosture?.trim() || "Review required"}</dd>
        </div>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-2">
          <dt className="font-semibold">Trust label</dt>
          <dd className="m-0 mt-1">
            <ExplanationEvidenceBasisBadges
              citationCount={citationCount}
              faithfulnessSupportRatio={faithfulnessRatio}
              deterministicFallbackUsed={isDeterministicExplanationFallback(explanationSummary)}
              compact
            />
          </dd>
        </div>
      </dl>

      {top.length > 0 ? (
        <div className="mt-4">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200">
            Top sponsor talking points
          </p>
          <ul className="mt-2 space-y-2 pl-5">
            {top.map((finding) => (
              <li key={finding.findingId}>
                <span className="font-semibold">{severityBadgeLabel(finding.severityValue)}:</span>{" "}
                {finding.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 m-0 text-xs text-teal-800 dark:text-teal-200">
        Next action: {buyerPolishedArtifactTable ? "send the executive briefing package" : "open the sponsor packet"}
        {" "}after confirming the evidence and ROI basis labels. This is decision support, not a legal or compliance
        attestation.
      </p>
    </section>
  );
}
