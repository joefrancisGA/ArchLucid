import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY } from "@/lib/semantic-support-band-async-honesty";
import { SEMANTIC_SUPPORT_BAND_VALUES } from "@/lib/semantic-support-band-adr-inventory";

export type FindingSemanticSupportBandValue = (typeof SEMANTIC_SUPPORT_BAND_VALUES)[number];

export const FINDING_SEMANTIC_SUPPORT_BAND_LABELS: Readonly<
  Record<FindingSemanticSupportBandValue, string>
> = {
  Supported: "Supported",
  Unchecked: "Not yet scored",
  Unsupported: "Unsupported",
  NotScored: "Not scored",
};

const HEURISTIC_OVERLAP_REASON = "Heuristic quote overlap between claim and citations.";

const PARTIAL_OR_ASYNC_REASON =
  "Partial overlap or async Lane B score still pending. Semantic support may lag the sealed review.";

const UNSUPPORTED_REASON = "Citations do not support this claim under the heuristic scorer.";

const NOT_SCORED_REASON =
  "No citation excerpts to score, or checklist coverage is exempt from semantic support.";

export function normalizeFindingSemanticSupportBand(
  raw: unknown,
): FindingSemanticSupportBandValue | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return (SEMANTIC_SUPPORT_BAND_VALUES as readonly string[]).includes(trimmed)
    ? (trimmed as FindingSemanticSupportBandValue)
    : null;
}

export function resolveDecisionGradeSemanticSupportBand(
  raw: unknown,
): FindingSemanticSupportBandValue {
  return normalizeFindingSemanticSupportBand(raw) ?? "NotScored";
}

export function semanticSupportBandStatusTagKind(
  band: FindingSemanticSupportBandValue,
): EnterpriseStatusKind {
  if (band === "Supported") {
    return "neutral";
  }

  if (band === "Unchecked") {
    return "needs-attention";
  }

  if (band === "Unsupported") {
    return "blocked";
  }

  return "neutral";
}

export function semanticSupportBandShortReason(band: FindingSemanticSupportBandValue): string {
  if (band === "Supported") {
    return HEURISTIC_OVERLAP_REASON;
  }

  if (band === "Unchecked") {
    return PARTIAL_OR_ASYNC_REASON;
  }

  if (band === "Unsupported") {
    return UNSUPPORTED_REASON;
  }

  return NOT_SCORED_REASON;
}

export function semanticSupportBandInspectDetail(band: FindingSemanticSupportBandValue): string {
  if (band === "Unchecked") {
    return `${semanticSupportBandShortReason(band)} ${SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY}`;
  }

  return semanticSupportBandShortReason(band);
}
