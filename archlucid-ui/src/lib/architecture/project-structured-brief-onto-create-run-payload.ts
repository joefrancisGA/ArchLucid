import type { CreateArchitectureRunRequestPayload } from "@/lib/api/architecture-runs";

import type { ArchitectureDraftStructuredBriefState } from "./architecture-draft-structured-brief";
import { mergeUniqueStrings } from "./architecture-draft-structured-brief";

function appendUnique(target: string[], line: string): void {
  const trimmed = line.trim();

  if (trimmed.length === 0) {
    return;
  }

  const merged = mergeUniqueStrings(target, [trimmed]);

  if (merged.length > target.length) {
    target.push(merged[merged.length - 1]!);
  }
}

/** Mirrors backend DraftRequestProjector — projects draft structured brief onto run constraints (TB-2282). */
export function projectStructuredBriefOntoCreateRunPayload(
  basePayload: CreateArchitectureRunRequestPayload,
  structuredBrief: ArchitectureDraftStructuredBriefState,
): CreateArchitectureRunRequestPayload {
  const constraints = [...basePayload.constraints];
  const inlineRequirements = [...(basePayload.inlineRequirements ?? [])];
  const assumptions = [...basePayload.assumptions];
  const requiredCapabilities = [...basePayload.requiredCapabilities];

  for (const constraint of structuredBrief.confirmedConstraints) {
    appendUnique(constraints, constraint);
  }

  for (const assumption of structuredBrief.confirmedAssumptions) {
    appendUnique(assumptions, assumption);
  }

  for (const capability of structuredBrief.confirmedRequiredCapabilities) {
    appendUnique(requiredCapabilities, capability);
  }

  if (structuredBrief.qualityAttribute.trim().length > 0) {
    appendUnique(inlineRequirements, `Quality attribute: ${structuredBrief.qualityAttribute.trim()}`);
  }

  if (structuredBrief.failureModeNote.trim().length > 0) {
    appendUnique(
      inlineRequirements,
      `Failure mode / continuity: ${structuredBrief.failureModeNote.trim()}`,
    );
  }

  if (structuredBrief.operationalOwner.trim().length > 0) {
    appendUnique(inlineRequirements, `Operational owner: ${structuredBrief.operationalOwner.trim()}`);
  }

  return {
    ...basePayload,
    constraints,
    inlineRequirements,
    assumptions,
    requiredCapabilities,
  };
}
