import { buildSponsorMarkdownMethodologyFooter } from "@/lib/sponsor-markdown-footer";

export const SPONSOR_EVIDENCE_CONFIDENCE_EMPTY_LINE =
  "Evidence confidence was not stored. Use the finalized review record and finding detail as the authoritative record." as const;
import type { RunExplanationSummary } from "@/types/explanation";
import { isDeterministicExplanationFallback } from "@/types/explanation";

export type SponsorRiskReviewFindingMarkdownRow = {
  readonly findingId: string;
  readonly title: string;
  readonly severity: string;
  readonly recommended: string;
};

function trimLine(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function formatSponsorFindingSeverityCell(severity: string | null | undefined): string {
  if (severity === null || severity === undefined || severity.length === 0) {
    return "Severity was not stored.";
  }

  const trimmed = severity.trim();

  if (trimmed.length === 0) {
    return "Severity was stored empty.";
  }

  return trimmed;
}

function pickRecommendedSponsorAction(_summary: RunExplanationSummary): string {
  return "This export has no separate sponsor-action field. Recommended actions are on the finding rows when they were stored.";
}

function formatSponsorFindingRecommendedAction(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "Recommended action was not stored.";
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Recommended action was stored empty.";
  }

  return trimmed;
}

function ratioPercentLabel(value: number | null | undefined, emptyLabel: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return emptyLabel;
  }

  return `${Math.round(value * 100)}%`;
}

function faithfulnessSupportRatioLine(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `Faithfulness support ratio: ${ratioPercentLabel(value, "Ratio not returned")}.`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return "Faithfulness support ratio was stored empty.";
    }

    const parsed = Number(trimmed);

    if (Number.isFinite(parsed)) {
      return `Faithfulness support ratio: ${ratioPercentLabel(parsed, "Ratio not returned")}.`;
    }

    return "Faithfulness support ratio was not stored.";
  }

  return null;
}

function formatAggregateModelConfidence(value: number): string {
  if (value > 1 && value <= 100) {
    return `${Math.round(value)}%`;
  }

  if (value >= 0 && value <= 1) {
    return `${Math.round(value * 100)}%`;
  }

  return String(value);
}

function mdTableCell(value: string): string {
  return value.replace(/\|/g, "/").replace(/\r\n/g, "\n").replace(/\n/g, " ").trim();
}

/**
 * Sponsor handoff Markdown aligned to the sponsor-first viewport (no server round-trip).
 */
export function buildSponsorRiskReviewMarkdown(
  runId: string,
  headline: string,
  summary: RunExplanationSummary,
  prioritizedFindings: readonly SponsorRiskReviewFindingMarkdownRow[],
): string {
  const structuredConfidence = summary.explanation?.structured?.confidence;
  const faithfulnessWarning =
    summary.faithfulnessWarning === null || summary.faithfulnessWarning === undefined
      ? "Faithfulness warning was not stored."
      : summary.faithfulnessWarning.trim().length === 0
        ? "Faithfulness warning was stored empty."
        : summary.faithfulnessWarning;
  const deterministicFallbackMissing =
    summary.deterministicFallbackUsed === null || summary.deterministicFallbackUsed === undefined;

  const evidenceParts = [
    typeof structuredConfidence === "number" && Number.isFinite(structuredConfidence)
      ? `Aggregate model confidence: ${formatAggregateModelConfidence(structuredConfidence)}.`
      : null,
    summary.faithfulnessSupportRatio === null || summary.faithfulnessSupportRatio === undefined
      ? "Faithfulness support ratio was not stored."
      : faithfulnessSupportRatioLine(summary.faithfulnessSupportRatio),
    faithfulnessWarning.length > 0 ? faithfulnessWarning : null,
    deterministicFallbackMissing ? "Deterministic fallback was not stored." : null,
    isDeterministicExplanationFallback(summary)
      ? "Some narrative was deterministically aligned to the review when live synthesis was unavailable."
      : null,
  ].filter((s): s is string => typeof s === "string" && s.length > 0);

  const remainingRiskParts = [
    trimLine(summary.riskPosture).length > 0 ? `Residual risk posture: ${summary.riskPosture}.` : null,
    typeof summary.findingCount === "number" && Number.isFinite(summary.findingCount)
      ? `${Math.trunc(summary.findingCount)} architecture finding${
          Math.trunc(summary.findingCount) === 1 ? "" : "s"
        } surfaced in this review.`
      : summary.findingCount === null || summary.findingCount === undefined
        ? "Finding count was not stored."
      : null,
    typeof summary.unresolvedIssueCount === "number" && Number.isFinite(summary.unresolvedIssueCount)
      ? `${summary.unresolvedIssueCount} unresolved review issue${
          Math.trunc(summary.unresolvedIssueCount) === 1 ? "" : "s"
        }.`
      : summary.unresolvedIssueCount === null || summary.unresolvedIssueCount === undefined
        ? "Unresolved issue count was not stored."
      : null,
    typeof summary.complianceGapCount === "number" && Number.isFinite(summary.complianceGapCount)
      ? Math.trunc(summary.complianceGapCount) === 0
        ? "0 compliance gaps were stored."
        : `${Math.trunc(summary.complianceGapCount)} compliance gap${
            Math.trunc(summary.complianceGapCount) === 1 ? "" : "s"
          } in the aggregate assessment.`
      : summary.complianceGapCount === null || summary.complianceGapCount === undefined
        ? "Compliance gap count was not stored."
      : null,
  ].filter((s): s is string => typeof s === "string" && s.length > 0);

  const findingLines =
    prioritizedFindings.length === 0
      ? "_Findings were not included in this export._\n"
      : [
          "| Severity | Finding | Recommended action |",
          "| --- | --- | --- |",
          ...prioritizedFindings.map(
            (r) =>
              `| ${mdTableCell(formatSponsorFindingSeverityCell(r.severity))} | ${mdTableCell(
                trimLine(r.title) || "Finding title was not stored",
              )} | ${mdTableCell(formatSponsorFindingRecommendedAction(r.recommended))} |`,
          ),
          "",
        ].join("\n");

  return [
    `# Sponsor report — ${headline}`,
    "",
    `- **Review ID:** ${
      runId.trim().length > 0 ? `\`${runId.trim()}\`` : "Review id was not stored."
    }`,
    "",
    "## Risk posture",
    "",
    trimLine(summary.riskPosture) || "Risk posture was not stored",
    "",
    "## Final decision",
    "",
    trimLine(summary.overallAssessment) || "Final decision was not stored",
    "",
    "## Remaining risk",
    "",
    ...remainingRiskParts.map((line) => `- ${line}`),
    "",
    "## Recommended sponsor action",
    "",
    pickRecommendedSponsorAction(summary),
    "",
    "## Evidence confidence",
    "",
    evidenceParts.length > 0
      ? evidenceParts.join(" ")
      : SPONSOR_EVIDENCE_CONFIDENCE_EMPTY_LINE,
    "",
    "## Prioritized findings (summary)",
    "",
    findingLines,
    "---",
    "",
    "_Generated for sponsor/board handoff from ArchLucid at export time. The DOCX architecture review may add formatting and annexes._",
    "",
    buildSponsorMarkdownMethodologyFooter(),
    "",
  ].join("\n");
}

export function executiveRiskReviewMarkdownFilename(runId: string): string {
  const safe = runId.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);

  return `sponsor-report-${safe.length > 0 ? safe : "run"}.md`;
}
