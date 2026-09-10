import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { isDecisionGradeFinding } from "@/lib/findings/review-detail-findings-classification-band";
import {
  type FindingSemanticSupportBandValue,
  resolveDecisionGradeSemanticSupportBand,
} from "@/lib/findings/semantic-support-band-presentation";

export const ASK_CITED_FINDINGS_SEMANTIC_SUPPORT_NOT_SEALED_COPY =
  "Ask is advisory working context — not the sealed review record (TB-1003)." as const;

const BAND_WEAKNESS_RANK: Readonly<Record<FindingSemanticSupportBandValue, number>> = {
  Supported: 0,
  NotScored: 1,
  Unchecked: 2,
  Unsupported: 3,
};

export type AskCitedFindingBandIndexEntry = {
  readonly findingId: string;
  readonly band: FindingSemanticSupportBandValue;
};

export function buildAskCitedFindingBandIndex(
  findings: readonly QuickDecisionFinding[],
): readonly AskCitedFindingBandIndexEntry[] {
  const entries: AskCitedFindingBandIndexEntry[] = [];

  for (const finding of findings) {
    if (!isDecisionGradeFinding(finding)) {
      continue;
    }

    const findingId = finding.findingId.trim();

    if (findingId.length === 0) {
      continue;
    }

    entries.push({
      findingId,
      band: resolveDecisionGradeSemanticSupportBand(finding.semanticSupportBand),
    });
  }

  return entries;
}

export function resolveWeakestAskCitedSemanticSupportBand(
  bands: readonly FindingSemanticSupportBandValue[],
): FindingSemanticSupportBandValue | null {
  if (bands.length === 0) {
    return null;
  }

  let weakest = bands[0];

  for (let index = 1; index < bands.length; index += 1) {
    const candidate = bands[index];

    if (BAND_WEAKNESS_RANK[candidate] > BAND_WEAKNESS_RANK[weakest]) {
      weakest = candidate;
    }
  }

  return weakest;
}

export function resolveWeakestAskCitedSemanticSupportBandForFindingIds(input: {
  readonly index: readonly AskCitedFindingBandIndexEntry[];
  readonly referencedFindingIds: readonly string[];
}): FindingSemanticSupportBandValue | null {
  const normalizedIds = new Set<string>();

  for (const rawId of input.referencedFindingIds) {
    const trimmed = rawId.trim();

    if (trimmed.length > 0) {
      normalizedIds.add(trimmed.toLowerCase());
    }
  }

  if (normalizedIds.size === 0) {
    return null;
  }

  const matchedBands: FindingSemanticSupportBandValue[] = [];

  for (const entry of input.index) {
    if (!normalizedIds.has(entry.findingId.trim().toLowerCase())) {
      continue;
    }

    matchedBands.push(entry.band);
  }

  return resolveWeakestAskCitedSemanticSupportBand(matchedBands);
}

export function formatAskCitedFindingsSemanticSupportBandFootnote(
  weakestBand: FindingSemanticSupportBandValue | null,
): string | null {
  if (weakestBand === null) {
    return null;
  }

  return (
    `Cited findings inherit the weakest semantic support band: ${weakestBand}. ` +
    "Ask cannot sound more certain than that band. " +
    ASK_CITED_FINDINGS_SEMANTIC_SUPPORT_NOT_SEALED_COPY
  );
}
