import {
  deriveFindingTrustPresentation,
  type FindingTrustPresentationInput,
} from "@/lib/findings/finding-trust-presentation";
import { FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX } from "@/lib/feasibility-verdict-transparency-trail";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import type { InferredTrailEntry } from "@/types/feasibility-verdict";

export const INFERRED_TRAIL_VALUE_NOT_STORED = "Inferred value was not stored." as const;
export const INFERRED_TRAIL_CONFIDENCE_NOT_STORED = "Confidence was not stored." as const;

function formatInferredTrailConfidence(confidence: number | null | undefined): string {
  if (
    typeof confidence === "number"
    && Number.isFinite(confidence)
    && confidence >= 1
    && confidence <= 100
  ) {
    return `confidence ${confidence}`;
  }

  return INFERRED_TRAIL_CONFIDENCE_NOT_STORED;
}

function formatInferredTrailValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return INFERRED_TRAIL_VALUE_NOT_STORED;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : "Inferred value was stored empty.";
}

export function buildInferredTrailFindingTrustLookup(
  findings: readonly QuickDecisionFinding[] | undefined,
): ReadonlyMap<string, FindingTrustPresentationInput> {
  const lookup = new Map<string, FindingTrustPresentationInput>();

  if (findings === undefined) {
    return lookup;
  }

  for (const finding of findings) {
    lookup.set(finding.findingId, {
      trustLabel: finding.trustLabel,
      trustLabelReason: finding.trustLabelReason,
      evidenceRefCount: finding.evidenceRefCount,
      confidenceLevel: finding.confidenceLevel,
    });
  }

  return lookup;
}

/** FC-14 — inferred trail rows for blocking findings show wire trust labels, not raw confidence alone. */
export function formatInferredTrailEntryLabel(
  entry: InferredTrailEntry,
  findingTrustById?: ReadonlyMap<string, FindingTrustPresentationInput>,
): string {
  const valueLabel = formatInferredTrailValue(entry.value);
  const confidenceLabel = formatInferredTrailConfidence(entry.confidence);

  if (entry.key === null || entry.key === undefined) {
    return `Inferred trail key was not stored. ${valueLabel} (${confidenceLabel})`;
  }

  const key = entry.key.trim();

  if (key.length === 0) {
    return `Inferred trail key was stored empty. ${valueLabel} (${confidenceLabel})`;
  }

  if (key.startsWith(FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX) && findingTrustById !== undefined) {
    const findingId = key.slice(FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX.length).trim();
    const trustInput = findingTrustById.get(findingId);

    if (trustInput !== undefined) {
      const presentation = deriveFindingTrustPresentation(trustInput);
      const trustLine = presentation.export.exportLine ?? presentation.export.canonicalTrustLabel;

      return `${valueLabel} · ${trustLine} (${confidenceLabel})`;
    }
  }

  return `${key}: ${valueLabel} (${confidenceLabel})`;
}
