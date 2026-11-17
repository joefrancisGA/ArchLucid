import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { feasibilityVerdictKindLabel } from "@/lib/feasibility-verdict-display";
import {
  hasUncheckedDecisionGradeSemanticSupportBand,
  type FindingSemanticSupportBandExportInput,
} from "@/lib/findings/finding-semantic-support-band-export";
import { normalizeFindingSemanticSupportBand } from "@/lib/findings/semantic-support-band-presentation";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";
import { SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY } from "@/lib/semantic-support-band-async-honesty";
import { formatStructuralExecutionModeLabel } from "@/lib/structural-execution-mode";
import type { ManifestSummary } from "@/types/authority";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import { isRecord } from "@/lib/export-markdown-text";

/** V1 §2.8 sponsor ROI non-summing honesty on sendable export covers. */
export const SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE =
  "Portfolio headline savings are disposition-aware and deduplicated by FindingId; per-system rows do not sum to the headline." as const;

export type SendableExportCoverInput = {
  readonly runId?: string | null;
  readonly manifestSummary?: ManifestSummary | null;
  readonly feasibilityVerdict?: ManifestFeasibilityVerdict | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly hostAgentExecutionMode?: string | null;
  readonly findings?: readonly FindingSemanticSupportBandExportInput[] | null;
  /** When greater than zero, the cover includes sponsor ROI non-summing honesty. */
  readonly sponsorRoiRowCount?: number | null;
};

function readClassificationFromWire(value: unknown): FindingSemanticSupportBandExportInput["classification"] {
  if (value === "DecisionGradeFinding" || value === "ChecklistCoverage") {
    return value;
  }

  return null;
}

/** Coerces findings snapshot wire JSON into sendable-cover band inputs. */
export function coerceSendableExportCoverFindingsFromSnapshot(
  snapshot: unknown,
): readonly FindingSemanticSupportBandExportInput[] | null {
  if (!isRecord(snapshot)) {
    return null;
  }

  if (!("findings" in snapshot)) {
    return null;
  }

  const findings = snapshot.findings;

  if (!Array.isArray(findings)) {
    return null;
  }

  const rows: FindingSemanticSupportBandExportInput[] = [];

  for (const entry of findings) {
    if (!isRecord(entry)) {
      continue;
    }

    rows.push({
      classification: readClassificationFromWire(entry.classification),
      semanticSupportBand: normalizeFindingSemanticSupportBand(entry.semanticSupportBand),
      insightDensityScore:
        typeof entry.insightDensityScore === "number" && Number.isFinite(entry.insightDensityScore)
          ? entry.insightDensityScore
          : null,
    });
  }

  return rows;
}

/** First-page sendable cover block for Markdown/DOCX-aligned exports. */
export function formatSendableExportCoverMarkdown(input: SendableExportCoverInput): string {
  const lines: string[] = [];
  const summary = input.manifestSummary ?? null;
  const runId = input.runId?.trim() ?? "";
  const feasibilityVerdict = input.feasibilityVerdict ?? summary?.feasibilityVerdict ?? null;
  const executionModeLabel =
    input.structuralExecutionMode !== null && input.structuralExecutionMode !== undefined
      ? formatStructuralExecutionModeLabel(input.structuralExecutionMode)
      : input.hostAgentExecutionMode?.trim() ?? null;
  const findings = input.findings;

  lines.push("## Sendable export cover");
  lines.push("");

  lines.push(
    runId.length > 0 ? `- **Review id:** \`${runId}\`` : "- **Review id:** Review id was not stored",
  );
  const ruleSetId = summary?.ruleSetId?.trim() ?? "";
  const ruleSetVersion = summary?.ruleSetVersion?.trim() ?? "";
  const reviewStatus = summary?.status?.trim() ?? "";

  if (summary === null) {
    lines.push("- **Policy pack:** Policy pack was not stored.");
  } else if (ruleSetId.length > 0 && ruleSetVersion.length > 0) {
    lines.push(`- **Policy pack:** ${ruleSetId} @ ${ruleSetVersion}`);
  } else {
    const policyPackParts: string[] = [];

    if (ruleSetId.length === 0) {
      policyPackParts.push("Policy pack id was not stored.");
    }

    if (ruleSetVersion.length === 0) {
      policyPackParts.push("Policy pack version was not stored.");
    }

    lines.push(`- **Policy pack:** ${policyPackParts.join(" ")}`);
  }
  lines.push(
    summary !== null && reviewStatus.length > 0
      ? `- **Review record status:** ${reviewStatus}`
      : "- **Review record status:** Review record status was not stored.",
  );

  if (feasibilityVerdict !== null) {
    lines.push(`- **Gate outcome:** ${feasibilityVerdictKindLabel(feasibilityVerdict.kind)}`);

    if (feasibilityVerdict.summary === null || feasibilityVerdict.summary === undefined) {
      lines.push("- **Gate summary:** Verdict summary was not stored.");
    } else if (feasibilityVerdict.summary.trim().length > 0) {
      lines.push(`- **Gate summary:** ${feasibilityVerdict.summary.trim()}`);
    } else {
      lines.push("- **Gate summary:** Verdict summary was stored empty.");
    }
  } else {
    lines.push("- **Gate outcome:** Gate outcome was not stored");
  }

  lines.push(
    executionModeLabel !== null && executionModeLabel.length > 0
      ? `- **Execution mode:** ${executionModeLabel}`
      : "- **Execution mode:** Execution mode was not stored",
  );

  lines.push(`- **Policy influence:** ${POLICY_PACK_INFLUENCE_HONESTY_LINE}`);

  if (findings === null || findings === undefined) {
    lines.push("- Findings were not stored on this export cover.");
  } else if (findings.length === 0) {
    lines.push("- Findings list was stored empty.");
  } else if (hasUncheckedDecisionGradeSemanticSupportBand(findings)) {
    lines.push(`- **Semantic support:** ${SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY}`);
  }

  const sponsorRoiRowCount = input.sponsorRoiRowCount;

  if (sponsorRoiRowCount === null || sponsorRoiRowCount === undefined) {
    lines.push("- **Sponsor ROI:** Sponsor savings were not stored on this export cover.");
  } else if (sponsorRoiRowCount === 0) {
    lines.push("- **Sponsor ROI:** No sponsor savings rows were stored.");
  } else {
    lines.push(`- **Sponsor ROI:** ${SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}`);
  }

  lines.push("");
  lines.push(
    "_Cover fields mirror the review-package stamp: policy pack, gate outcome, and execution mode before findings._",
  );
  lines.push("");

  return lines.join("\n");
}

export function resolveSendableExportCoverFindings(input: {
  readonly exportFindings?: readonly FindingSemanticSupportBandExportInput[] | null;
  readonly findingsSnapshot?: unknown;
}): readonly FindingSemanticSupportBandExportInput[] | null {
  if (input.exportFindings !== null && input.exportFindings !== undefined && input.exportFindings.length > 0) {
    return input.exportFindings;
  }

  if (input.exportFindings === null || input.exportFindings === undefined) {
    if (input.findingsSnapshot === null || input.findingsSnapshot === undefined) {
      return null;
    }
  }

  return coerceSendableExportCoverFindingsFromSnapshot(input.findingsSnapshot);
}

/** Exported for tests — decision-grade classification marker on wire findings. */
export const SENDABLE_EXPORT_COVER_DECISION_GRADE_CLASSIFICATION = FINDING_CLASSIFICATION_DECISION_GRADE;
