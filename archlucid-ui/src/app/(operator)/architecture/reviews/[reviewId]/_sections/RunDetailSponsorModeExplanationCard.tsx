import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { ExplanationEvidenceBasisBadges } from "@/components/ExplanationEvidenceBasisBadges";
import { isReviewFindingDispositionClosed } from "@/lib/findings/finding-job-view";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { severityBadgeLabel } from "@/lib/quick-decision-summary-derive";
import { formatExportPreviewCapIntro, formatExportPreviewShortenedText } from "@/lib/export-preview-caption-honesty";
import type { RunExplanationSummary } from "@/types/explanation";
import { isDeterministicExplanationFallback, normalizeFiniteRatio } from "@/types/explanation";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type RunDetailSponsorModeExplanationCardProps = {
  readonly explanationSummary: RunExplanationSummary | null;
  readonly findings: readonly QuickDecisionFinding[];
  readonly buyerPolishedArtifactTable: boolean;
};

function formatRiskPosture(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "Risk posture was not stored.";
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Risk posture was stored empty.";
  }

  return trimmed;
}

function firstNonEmptyLine(value: string): string {
  return value.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? value;
}

function formatNarrativeSummaryLine(explanationSummary: RunExplanationSummary | null): string {
  if (explanationSummary === null) {
    return "Narrative summary was not stored.";
  }

  const raw = explanationSummary.overallAssessment ?? explanationSummary.explanation?.summary;

  if (raw === null || raw === undefined) {
    return "Narrative summary was not stored.";
  }

  if (raw.trim().length === 0) {
    return "Narrative summary was stored empty.";
  }

  return firstNonEmptyLine(raw);
}

function visibleSponsorFindings(findings: readonly QuickDecisionFinding[]): QuickDecisionFinding[] {
  return findings.filter(
    (finding) => !finding.isMuted && !isReviewFindingDispositionClosed(finding),
  );
}

function topFindings(findings: readonly QuickDecisionFinding[]): readonly QuickDecisionFinding[] {
  return [...visibleSponsorFindings(findings)]
    .sort((a, b) => {
      const severityDelta = compareFindingSeverity(a.severityValue, b.severityValue);

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
  const visibleFindings = visibleSponsorFindings(findings);
  const top = topFindings(findings);

  if (explanationSummary === null && top.length === 0) {
    return null;
  }

  const citations = explanationSummary?.citations;
  const citationCount = citations?.length ?? 0;
  const faithfulnessRatio = normalizeFiniteRatio(explanationSummary?.faithfulnessSupportRatio);
  const basisLabel =
    citations === undefined || citations === null
      ? "Citations were not stored."
      : citationCount > 0
        ? `${citationCount} persisted citation${citationCount === 1 ? "" : "s"}`
        : "0 citations were stored.";

  return (
    <section
      className={cn("rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}
      data-testid="sponsor-mode-explanation-card"
      aria-labelledby="sponsor-mode-explanation-heading"
    >
      <header className="space-y-1">
        <p className={cn("m-0 text-al-text-secondary dark:text-neutral-200", OPERATOR_NAV_GROUP_LABEL)}>
          Sponsor-mode explanation
        </p>
        <h3 id="sponsor-mode-explanation-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Explain this review like I am the sponsor
        </h3>
      </header>

      <p className={cn("m-0 mt-3 text-al-text-primary dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {formatNarrativeSummaryLine(explanationSummary)}
      </p>

      <dl className={cn("mt-3 grid gap-2 sm:grid-cols-3", OPERATOR_TYPOGRAPHY.helper)}>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-2">
          <dt className="font-semibold">Evidence basis</dt>
          <dd className="m-0 mt-1">{basisLabel}</dd>
        </div>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-2">
          <dt className="font-semibold">Risk posture</dt>
          <dd className="m-0 mt-1">{formatRiskPosture(explanationSummary?.riskPosture)}</dd>
        </div>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-2">
          <dt className="font-semibold">Trust label</dt>
          <dd className="m-0 mt-1">
            <ExplanationEvidenceBasisBadges
              citationCount={citations === undefined || citations === null ? null : citationCount}
              faithfulnessSupportRatio={faithfulnessRatio}
              deterministicFallbackUsed={isDeterministicExplanationFallback(explanationSummary)}
              compact
            />
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className={cn("m-0 text-al-text-secondary dark:text-neutral-200", OPERATOR_NAV_GROUP_LABEL)}>
          Sponsor talking points ({formatExportPreviewCapIntro(top.length, visibleFindings.length, "preview lines")})
        </p>
        {top.length > 0 ? (
          <ul className="mt-2 space-y-2 pl-5">
            {top.map((finding) => (
              <li key={finding.findingId}>
                <span className="font-semibold">{severityBadgeLabel(finding.severityValue)}:</span>{" "}
                {formatExportPreviewShortenedText(finding.title, "Finding title was not stored.")}
              </li>
            ))}
          </ul>
        ) : visibleFindings.length === 0 && findings.length > 0 ? (
          <p className={cn("m-0 mt-2 text-al-text-primary dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            Only muted or closed findings remain on this review; no open sponsor talking points were listed.
          </p>
        ) : (
          <p className={cn("m-0 mt-2 text-al-text-primary dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            Sponsor talking points were not stored.
          </p>
        )}
      </div>

      <p className={cn("m-0 mt-4 text-al-text-secondary dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
        Next action: {buyerPolishedArtifactTable ? "send the sponsor briefing export" : "open the sponsor briefing"}
        {" "}after confirming the evidence and ROI basis labels. This is decision support, not a legal or compliance
        attestation.
      </p>
    </section>
  );
}
