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
  if (utc === null || utc.trim().length === 0) {
    return null;
  }

  const parsed = new Date(utc);

  if (Number.isNaN(parsed.getTime())) {
    return null;
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

export function buildClarificationGapSourcePresentation(input: {
  readonly capturedAtUtc: string | null;
  readonly fromHandoff: boolean;
  readonly findingsDerived?: boolean;
}): ClarificationGapSourcePresentation {
  return {
    label: input.findingsDerived === true ? "From assessment findings" : ARCHITECTURE_STRUCTURED_ASSERTED_LABEL,
    capturedAtLabel: formatGapCapturedAtLabel(input.capturedAtUtc),
  };
}

export function clarificationGapImpactCopy(item: ArchitectureMissingItem): string {
  switch (item.id) {
    case "business-outcome":
      return "Sponsors need a clear outcome before approving assessment scope.";

    case "architecture-overview":
      return "Assessors cannot map risks without enough system context.";

    case "people-systems":
      return "Ownership and integration boundaries stay unclear without named actors.";

    case "diagram":
      return "The evidence trail lacks visual architecture context for reviewers.";

    case "assessment-progress":
      return "Findings and readiness signals are still being generated.";

    default:
      return "Resolving this gap improves assessment confidence.";
  }
}
