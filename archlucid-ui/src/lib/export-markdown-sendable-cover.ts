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
): readonly FindingSemanticSupportBandExportInput[] {
  if (!isRecord(snapshot)) {
    return [];
  }

  const findings = snapshot.findings;

  if (!Array.isArray(findings)) {
    return [];
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
  const findings = input.findings ?? [];

  lines.push("## Sendable export cover");
  lines.push("");

  if (runId.length > 0) {
    lines.push(`- **Review id:** \`${runId}\``);
  }

  if (summary !== null) {
    lines.push(`- **Policy pack:** ${summary.ruleSetId} @ ${summary.ruleSetVersion}`);
    lines.push(`- **Review record status:** ${summary.status}`);
  }

  if (feasibilityVerdict !== null) {
    lines.push(`- **Gate outcome:** ${feasibilityVerdictKindLabel(feasibilityVerdict.kind)}`);

    const gateSummary = feasibilityVerdict.summary?.trim();

    if (gateSummary !== null && gateSummary !== undefined && gateSummary.length > 0) {
      lines.push(`- **Gate summary:** ${gateSummary}`);
    }
  }

  if (executionModeLabel !== null && executionModeLabel.length > 0) {
    lines.push(`- **Execution mode:** ${executionModeLabel}`);
  }

  lines.push(`- **Policy influence:** ${POLICY_PACK_INFLUENCE_HONESTY_LINE}`);

  if (hasUncheckedDecisionGradeSemanticSupportBand(findings)) {
    lines.push(`- **Semantic support:** ${SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY}`);
  }

  lines.push(`- **Sponsor ROI:** ${SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}`);

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
}): readonly FindingSemanticSupportBandExportInput[] {
  if (input.exportFindings !== null && input.exportFindings !== undefined && input.exportFindings.length > 0) {
    return input.exportFindings;
  }

  return coerceSendableExportCoverFindingsFromSnapshot(input.findingsSnapshot);
}

/** Exported for tests — decision-grade classification marker on wire findings. */
export const SENDABLE_EXPORT_COVER_DECISION_GRADE_CLASSIFICATION = FINDING_CLASSIFICATION_DECISION_GRADE;
