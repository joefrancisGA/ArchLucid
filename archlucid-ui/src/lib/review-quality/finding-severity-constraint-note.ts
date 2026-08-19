import { findingInspectNarrativeFields } from "@/lib/findings/finding-display-from-inspect";
import { buildSeverityConstraintNote, type StatedConstraintContext } from "@/lib/review-quality/assumption-and-severity";
import type { FindingInspectPayload } from "@/types/finding-inspect";

function combinedFindingText(payload: FindingInspectPayload): string {
  const narrative = findingInspectNarrativeFields(payload);
  const recommendation = payload.recommendedActions.join("\n");
  const reasoning = payload.reasoningSummary?.trim() ?? payload.reasoningTrace?.trim() ?? "";

  return `${narrative.title ?? ""}\n${narrative.description ?? ""}\n${recommendation}\n${reasoning}`;
}

export function buildSeverityConstraintNoteForInspectPayload(
  payload: FindingInspectPayload,
  statedConstraints: StatedConstraintContext | null,
): string | null {
  if (statedConstraints === null) {
    return null;
  }

  return buildSeverityConstraintNote(combinedFindingText(payload), statedConstraints);
}
