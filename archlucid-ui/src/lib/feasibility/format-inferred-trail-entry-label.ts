import {
  deriveFindingTrustPresentation,
  type FindingTrustPresentationInput,
} from "@/lib/findings/finding-trust-presentation";
import { FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX } from "@/lib/feasibility-verdict-transparency-trail";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import type { InferredTrailEntry } from "@/types/feasibility-verdict";

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
  const key = entry.key.trim();

  if (key.startsWith(FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX) && findingTrustById !== undefined) {
    const findingId = key.slice(FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX.length).trim();
    const trustInput = findingTrustById.get(findingId);

    if (trustInput !== undefined) {
      const presentation = deriveFindingTrustPresentation(trustInput);
      const trustLine = presentation.export.exportLine ?? presentation.export.canonicalTrustLabel;

      return `${entry.value} · ${trustLine} (confidence ${entry.confidence})`;
    }
  }

  return `${entry.key}: ${entry.value} (confidence ${entry.confidence})`;
}
