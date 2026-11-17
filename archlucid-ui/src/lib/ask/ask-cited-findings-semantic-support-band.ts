import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { isDecisionGradeFinding } from "@/lib/findings/review-detail-findings-classification-band";
import {
  FINDING_SEMANTIC_SUPPORT_BAND_NOT_STORED_COPY,
  type FindingSemanticSupportBandValue,
  normalizeFindingSemanticSupportBand,
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
  readonly band: FindingSemanticSupportBandValue | null;
  readonly bandStored: boolean;
};

/**
 * Single-finding Ask surfaces pass a normalized optional band, not a findings list.
 * Omitted/null must stay bandStored=false so the footnote uses not-stored copy instead of guessing NotScored.
 */
export function askCitedFindingBandIndexEntryFromOptionalBand(
  findingId: string,
  semanticSupportBand: FindingSemanticSupportBandValue | null | undefined,
): AskCitedFindingBandIndexEntry {
  if (semanticSupportBand === undefined || semanticSupportBand === null) {
    return {
      findingId,
      band: null,
      bandStored: false,
    };
  }

  return {
    findingId,
    band: semanticSupportBand,
    bandStored: true,
  };
}

export function askCitedFindingBandIndexForFinding(
  findingId: string,
  rawBand: FindingSemanticSupportBandValue | null | undefined,
): readonly AskCitedFindingBandIndexEntry[] {
  const trimmedId = findingId.trim();

  if (trimmedId.length === 0) {
    return [];
  }

  return [askCitedFindingBandIndexEntryFromOptionalBand(trimmedId, rawBand)];
}

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

    const rawBand: unknown = finding.semanticSupportBand;

    if (rawBand === null || rawBand === undefined) {
      entries.push({
        findingId,
        band: null,
        bandStored: false,
      });
      continue;
    }

    if (rawBand === "") {
      entries.push({
        findingId,
        band: null,
        bandStored: true,
      });
      continue;
    }

    entries.push({
      findingId,
      band: normalizeFindingSemanticSupportBand(rawBand),
      bandStored: true,
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

export const ASK_CITED_FINDING_NOT_IN_LOADED_INDEX_COPY =
  "Cited finding was not in the loaded decision-grade findings, so semantic support was not read." as const;

export type AskCitedSemanticSupportBandResolution = {
  readonly weakestBand: FindingSemanticSupportBandValue | null;
  readonly hasMissingStoredBand: boolean;
  readonly hasFindingNotInLoadedIndex: boolean;
};

export function resolveAskCitedSemanticSupportBandForFindingIds(input: {
  readonly index: readonly AskCitedFindingBandIndexEntry[];
  readonly referencedFindingIds: readonly string[];
}): AskCitedSemanticSupportBandResolution {
  const normalizedIds = new Set<string>();

  for (const rawId of input.referencedFindingIds) {
    const trimmed = rawId.trim();

    if (trimmed.length > 0) {
      normalizedIds.add(trimmed.toLowerCase());
    }
  }

  if (normalizedIds.size === 0) {
    return { weakestBand: null, hasMissingStoredBand: false, hasFindingNotInLoadedIndex: false };
  }

  const indexIds = new Set(
    input.index.map((entry) => entry.findingId.trim().toLowerCase()).filter((id) => id.length > 0),
  );

  let hasFindingNotInLoadedIndex = false;

  for (const citedId of normalizedIds) {
    if (!indexIds.has(citedId)) {
      hasFindingNotInLoadedIndex = true;
      break;
    }
  }

  const matchedBands: FindingSemanticSupportBandValue[] = [];
  let hasMissingStoredBand = false;

  for (const entry of input.index) {
    if (!normalizedIds.has(entry.findingId.trim().toLowerCase())) {
      continue;
    }

    if (!entry.bandStored) {
      hasMissingStoredBand = true;
      continue;
    }

    if (entry.band === null) {
      continue;
    }

    matchedBands.push(entry.band);
  }

  return {
    weakestBand: resolveWeakestAskCitedSemanticSupportBand(matchedBands),
    hasMissingStoredBand,
    hasFindingNotInLoadedIndex,
  };
}

export function resolveWeakestAskCitedSemanticSupportBandForFindingIds(input: {
  readonly index: readonly AskCitedFindingBandIndexEntry[];
  readonly referencedFindingIds: readonly string[];
}): FindingSemanticSupportBandValue | null {
  return resolveAskCitedSemanticSupportBandForFindingIds(input).weakestBand;
}

export function formatAskCitedFindingsSemanticSupportBandFootnote(
  resolution: AskCitedSemanticSupportBandResolution | FindingSemanticSupportBandValue | null,
): string | null {
  if (resolution === null) {
    return null;
  }

  if (typeof resolution === "string") {
    return (
      `Cited findings inherit the weakest semantic support band: ${resolution}. ` +
      "Ask cannot sound more certain than that band. " +
      ASK_CITED_FINDINGS_SEMANTIC_SUPPORT_NOT_SEALED_COPY
    );
  }

  if (resolution.hasFindingNotInLoadedIndex) {
    return (
      `${ASK_CITED_FINDING_NOT_IN_LOADED_INDEX_COPY} ` +
      "Ask cannot sound more certain than cited findings. " +
      ASK_CITED_FINDINGS_SEMANTIC_SUPPORT_NOT_SEALED_COPY
    );
  }

  if (resolution.hasMissingStoredBand) {
    return (
      `${FINDING_SEMANTIC_SUPPORT_BAND_NOT_STORED_COPY} ` +
      "Ask cannot sound more certain than cited findings. " +
      ASK_CITED_FINDINGS_SEMANTIC_SUPPORT_NOT_SEALED_COPY
    );
  }

  if (resolution.weakestBand === null) {
    return (
      `${FINDING_SEMANTIC_SUPPORT_BAND_NOT_STORED_COPY} ` +
      "Ask cannot sound more certain than cited findings. " +
      ASK_CITED_FINDINGS_SEMANTIC_SUPPORT_NOT_SEALED_COPY
    );
  }

  return formatAskCitedFindingsSemanticSupportBandFootnote(resolution.weakestBand);
}
