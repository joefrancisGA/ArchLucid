import { ARCHITECTURE_STRUCTURED_ASSERTED_LABEL } from "@/lib/architecture/architecture-structured-content-copy";
import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-model";

export type ClarificationGapSourcePresentation = {
  readonly label: string;
  readonly capturedAtLabel: string | null;
};

export function formatClarificationGapSourceLabel(
  source: ClarificationGapSourcePresentation,
): string {
  if (source.capturedAtLabel === null || source.capturedAtLabel.length === 0) {
    return source.label;
  }

  return `${source.label} · ${source.capturedAtLabel}`;
}

export function formatGapCapturedAtLabel(utc: string | null): string | null {
  if (utc === null) {
    return "Captured time was not stored.";
  }

  if (utc.length === 0 || utc.trim().length === 0) {
    return "Captured time was stored empty.";
  }

  const parsed = new Date(utc);

  if (Number.isNaN(parsed.getTime())) {
    return "Captured time could not be read.";
  }

  // Clock-only label has no shared formatter; pinned to UTC with the zone shown so the
  // same capture time reads identically for every reviewer (TB-1678).
  const capturedAt = parsed.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return `captured ${capturedAt}`;
}

export const ARCHITECTURE_INTAKE_HEURISTIC_GAP_SOURCE_LABEL =
  "Checked on this page — not a line from the brief." as const;

export const CLARIFICATION_GAP_STANDARD_IMPACT_PREFIX =
  "Standard prompt, not a stored impact." as const;

function standardClarificationGapImpact(body: string): string {
  return `${CLARIFICATION_GAP_STANDARD_IMPACT_PREFIX} ${body}`;
}

export function buildClarificationGapSourcePresentation(input: {
  readonly capturedAtUtc: string | null;
  readonly fromHandoff: boolean;
  readonly findingsDerived?: boolean;
  readonly heuristicDerived?: boolean;
}): ClarificationGapSourcePresentation {
  const capturedAtLabel =
    input.findingsDerived === true || input.capturedAtUtc !== null
      ? formatGapCapturedAtLabel(input.capturedAtUtc)
      : null;

  if (input.heuristicDerived === true) {
    return {
      label: ARCHITECTURE_INTAKE_HEURISTIC_GAP_SOURCE_LABEL,
      capturedAtLabel,
    };
  }

  return {
    label: input.findingsDerived === true ? "From assessment findings" : ARCHITECTURE_STRUCTURED_ASSERTED_LABEL,
    capturedAtLabel,
  };
}

export function formatClarificationGapImpactDisplay(impact: string): string {
  const trimmed = impact.trim();

  if (trimmed.length === 0) {
    return "Gap impact was not stored.";
  }

  return trimmed;
}

export function clarificationGapImpactCopy(item: ArchitectureMissingItem): string {
  switch (item.id) {
    case "business-outcome":
      return standardClarificationGapImpact(
        "Sponsors need a clear outcome before approving assessment scope.",
      );

    case "architecture-overview":
      return standardClarificationGapImpact(
        "Assessors cannot map risks without enough system context.",
      );

    case "people-systems":
      return standardClarificationGapImpact(
        "Ownership and integration boundaries stay unclear without named actors.",
      );

    case "diagram":
      return standardClarificationGapImpact(
        "The evidence trail lacks visual architecture context for reviewers.",
      );

    case "assessment-progress":
      return standardClarificationGapImpact(
        "Findings and readiness signals are still being generated.",
      );

    default:
      return CLARIFICATION_GAP_STANDARD_IMPACT_PREFIX;
  }
}
