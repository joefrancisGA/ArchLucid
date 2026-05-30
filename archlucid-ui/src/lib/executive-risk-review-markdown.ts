import { buildSponsorMarkdownMethodologyFooter } from "@/lib/sponsor-markdown-footer";
import type { RunExplanationSummary } from "@/types/explanation";
import { isDeterministicExplanationFallback } from "@/types/explanation";

export type ExecutiveRiskReviewFindingMarkdownRow = {
  readonly findingId: string;
  readonly title: string;
  readonly severity: string;
  readonly recommended: string;
};

function trimLine(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function pickRecommendedExecutiveAction(summary: RunExplanationSummary): string {
  const firstTheme = summary.themeSummaries?.find((t) => t.trim().length > 0)?.trim();

  if (firstTheme !== null && firstTheme !== undefined && firstTheme.length > 0) {
    return firstTheme;
  }

  const risk = summary.explanation?.riskImplications?.find((r) => r.trim().length > 0)?.trim();

  if (risk !== null && risk !== undefined && risk.length > 0) {
    return risk;
  }

  const driver = summary.explanation?.keyDrivers?.find((d) => d.trim().length > 0)?.trim();

  if (driver !== null && driver !== undefined && driver.length > 0) {
    return driver;
  }

  return "Review prioritized findings and align owners on monitored items before the next change window.";
}

function ratioPercentLabel(value: number | null | undefined, emptyLabel: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return emptyLabel;
  }

  return `${Math.round(value * 100)}%`;
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
 * Sponsor handoff Markdown aligned to the executive-first viewport (no server round-trip).
 */
export function buildExecutiveRiskReviewMarkdown(
  runId: string,
  headline: string,
  summary: RunExplanationSummary,
  prioritizedFindings: readonly ExecutiveRiskReviewFindingMarkdownRow[],
): string {
  const structuredConfidence = summary.explanation?.structured?.confidence;
  const faithfulnessWarningTrimmed = trimLine(summary.faithfulnessWarning);

  const evidenceParts = [
    typeof structuredConfidence === "number" && Number.isFinite(structuredConfidence)
      ? `Aggregate model confidence: ${formatAggregateModelConfidence(structuredConfidence)}.`
      : null,
    typeof summary.faithfulnessSupportRatio === "number" && Number.isFinite(summary.faithfulnessSupportRatio)
      ? `Faithfulness support ratio: ${ratioPercentLabel(summary.faithfulnessSupportRatio, "—")}.`
      : null,
    faithfulnessWarningTrimmed.length > 0 ? faithfulnessWarningTrimmed : null,
    isDeterministicExplanationFallback(summary)
      ? "Some narrative was deterministically aligned to the manifest when live synthesis was unavailable."
      : null,
  ].filter((s): s is string => typeof s === "string" && s.length > 0);

  const remainingRiskParts = [
    `Residual risk posture: ${summary.riskPosture}.`,
    typeof summary.findingCount === "number" && Number.isFinite(summary.findingCount)
      ? `${Math.trunc(summary.findingCount)} architecture finding${
          Math.trunc(summary.findingCount) === 1 ? "" : "s"
        } surfaced in this review package.`
      : null,
    typeof summary.unresolvedIssueCount === "number" && Number.isFinite(summary.unresolvedIssueCount)
      ? `${summary.unresolvedIssueCount} unresolved manifest issue${
          Math.trunc(summary.unresolvedIssueCount) === 1 ? "" : "s"
        }.`
      : null,
    typeof summary.complianceGapCount === "number" &&
    Number.isFinite(summary.complianceGapCount) &&
    Math.trunc(summary.complianceGapCount) > 0
      ? `${Math.trunc(summary.complianceGapCount)} compliance gap${
          Math.trunc(summary.complianceGapCount) === 1 ? "" : "s"
        } in the aggregate assessment.`
      : null,
  ].filter((s): s is string => typeof s === "string" && s.length > 0);

  const findingLines =
    prioritizedFindings.length === 0
      ? "_No finding rows were included in this export._\n"
      : [
          "| Severity | Finding | Recommended action |",
          "| --- | --- | --- |",
          ...prioritizedFindings.map(
            (r) =>
              `| ${mdTableCell(r.severity)} | ${mdTableCell(r.title)} | ${mdTableCell(r.recommended)} |`,
          ),
          "",
        ].join("\n");

  return [
    `# Executive summary — ${headline}`,
    "",
    `- **Run ID:** \`${runId.trim()}\``,
    "",
    "## Risk posture",
    "",
    trimLine(summary.riskPosture),
    "",
    "## Final decision",
    "",
    trimLine(summary.overallAssessment),
    "",
    "## Remaining risk",
    "",
    ...remainingRiskParts.map((line) => `- ${line}`),
    "",
    "## Recommended executive action",
    "",
    pickRecommendedExecutiveAction(summary),
    "",
    "## Evidence confidence",
    "",
    evidenceParts.length > 0
      ? evidenceParts.join(" ")
      : "Confidence metadata was not returned — use the signed manifest and finding detail as the authoritative record.",
    "",
    "## Prioritized findings (summary)",
    "",
    findingLines,
    "---",
    "",
    "_Generated for sponsor/board handoff from ArchLucid at export time. The DOCX architecture package may add formatting and annexes._",
    "",
    buildSponsorMarkdownMethodologyFooter(),
    "",
  ].join("\n");
}

export function executiveRiskReviewMarkdownFilename(runId: string): string {
  const safe = runId.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);

  return `executive-summary-${safe.length > 0 ? safe : "run"}.md`;
}
