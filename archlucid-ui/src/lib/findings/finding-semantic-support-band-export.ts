import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";



import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";
import {
  countDecisionGradeSemanticSupportBandsForPresentation,
  formatStampSemanticSupportBandLineForPresentation,
} from "@/lib/findings/semantic-support-band-stamp";
import {
  normalizeFindingSemanticSupportBand,
  resolveDecisionGradeSemanticSupportBand,
  type FindingSemanticSupportBandValue,
} from "@/lib/findings/semantic-support-band-presentation";


/** Mirrors `FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1` (AS-057 / AS-060). */
export const FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION = "as057-v1";

export type FindingSemanticSupportBandExportFields = {
  readonly semanticSupportBand: FindingSemanticSupportBandValue;
  readonly semanticSupportBandScorerVersion: string;
};

export type SemanticSupportBandExportStamp = {
  readonly scorerVersion: string;
  readonly counts: ReturnType<typeof countDecisionGradeSemanticSupportBandsForPresentation>;
  readonly stampLine: string | null;
};

export type FindingSemanticSupportBandExportInput = Pick<
  QuickDecisionFinding,
  "classification" | "semanticSupportBand"
> &
  Partial<Pick<QuickDecisionFinding, "insightDensityScore">>;

function isDecisionGradeForSemanticSupportExport(
  finding: FindingSemanticSupportBandExportInput,
): boolean {
  if (finding.classification === FINDING_CLASSIFICATION_DECISION_GRADE) {
    return true;
  }

  if (finding.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
    return false;
  }

  const score = finding.insightDensityScore;

  if (score === null || score === undefined) {
    return true;
  }

  return score >= 50;
}

export function resolveFindingSemanticSupportBandExportFields(
  finding: FindingSemanticSupportBandExportInput,
): FindingSemanticSupportBandExportFields | null {
  if (!isDecisionGradeForSemanticSupportExport(finding)) {
    return null;
  }

  return {
    semanticSupportBand: resolveDecisionGradeSemanticSupportBand(finding.semanticSupportBand),
    semanticSupportBandScorerVersion: FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION,
  };
}

export function buildSemanticSupportBandExportStamp(
  findings: readonly QuickDecisionFinding[],
  structuralExecutionMode?: StructuralExecutionModeInput,
): SemanticSupportBandExportStamp {
  const counts = countDecisionGradeSemanticSupportBandsForPresentation(findings, structuralExecutionMode);
  const stampLine = formatStampSemanticSupportBandLineForPresentation(counts, structuralExecutionMode);

  return {
    scorerVersion: FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION,
    counts,
    stampLine,
  };
}

export function formatCareerExportSemanticSupportBandMarkdownSection(
  findings: readonly QuickDecisionFinding[],
  structuralExecutionMode?: StructuralExecutionModeInput,
): string {
  const stamp = buildSemanticSupportBandExportStamp(findings, structuralExecutionMode);

  if (stamp.stampLine === null) {
    return "";
  }

  const lines = [
    "## Semantic support",
    "",
    `Scorer version: \`${stamp.scorerVersion}\`.`,
    stamp.stampLine,
    "",
  ];

  return lines.join("\n");
}

export function resolveSupportingFindingSemanticSupportBands(
  supportingFindingIds: readonly string[],
  findings: readonly QuickDecisionFinding[],
): Record<string, FindingSemanticSupportBandValue> {
  const byId = new Map(findings.map((finding) => [finding.findingId, finding]));
  const bands: Record<string, FindingSemanticSupportBandValue> = {};

  for (const findingId of supportingFindingIds) {
    const finding = byId.get(findingId);
    const fields = finding === undefined ? null : resolveFindingSemanticSupportBandExportFields(finding);

    if (fields === null) {
      continue;
    }

    bands[findingId] = fields.semanticSupportBand;
  }

  return bands;
}

export function normalizeExportedSemanticSupportBand(
  raw: unknown,
): FindingSemanticSupportBandValue | null {
  return normalizeFindingSemanticSupportBand(raw);
}
