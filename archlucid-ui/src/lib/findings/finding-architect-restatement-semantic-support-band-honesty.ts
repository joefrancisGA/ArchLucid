import type { FindingSemanticSupportBandValue } from "@/lib/findings/semantic-support-band-presentation";

export const ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_DISPOSITION_COPY =
  "Architect restatement is human judgment on the disposition trail. It does not change the semantic support band on the sealed model claim.";

export const ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_CLAIM_LINE_COPY =
  "Claim band — scored from sealed model/typed finding prose.";

export const ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_RESTATEMENT_LINE_COPY =
  "Operator restatement — human judgment; not scored as Supported.";

export type DispositionHistoryRestatementEvent = {
  readonly architectRestatement?: string | null;
};

/** Latest non-blank trail-backed architect restatement from disposition history (newest first). */
export function latestTrailBackedArchitectRestatement(
  history: readonly DispositionHistoryRestatementEvent[],
): string | null {
  for (const event of history) {
    const trimmed = event.architectRestatement?.trim() ?? "";

    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
}

/** AS-070: human restatement band is never Supported even when quote overlap would score Supported. */
export function resolveArchitectRestatementHumanJudgmentBand(
  rawBand: FindingSemanticSupportBandValue | null,
): FindingSemanticSupportBandValue {
  if (rawBand === "Supported") {
    return "NotScored";
  }

  return rawBand ?? "NotScored";
}

export function shouldShowArchitectRestatementSemanticSupportBandSplit(
  trailBackedArchitectRestatement: string | null | undefined,
): boolean {
  return (trailBackedArchitectRestatement?.trim().length ?? 0) > 0;
}
