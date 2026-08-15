import type { ActorDescriptor, DraftRequestDocument } from "@/types/draft-intake";

/** Explicit unknown sentinel — silence is not treated as “none” (TB-2282). */
export const ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL = "Unknown — confirm before review" as const;

export type ArchitectureDraftStructuredBriefState = {
  readonly confirmedConstraints: readonly string[];
  readonly confirmedAssumptions: readonly string[];
  readonly confirmedRequiredCapabilities: readonly string[];
  readonly suggestedConstraints: readonly string[];
  readonly suggestedAssumptions: readonly string[];
  readonly suggestedRequiredCapabilities: readonly string[];
  readonly qualityAttribute: string;
  readonly failureModeNote: string;
  readonly operationalOwner: string;
};

export function emptyArchitectureDraftStructuredBrief(): ArchitectureDraftStructuredBriefState {
  return {
    confirmedConstraints: [],
    confirmedAssumptions: [],
    confirmedRequiredCapabilities: [],
    suggestedConstraints: [],
    suggestedAssumptions: [],
    suggestedRequiredCapabilities: [],
    qualityAttribute: "",
    failureModeNote: "",
    operationalOwner: "",
  };
}

export function listHasConfirmedEntry(items: readonly string[]): boolean {
  return items.some((item) => item.trim().length > 0);
}

export function qualityAttributeMeetsMinimum(value: string): boolean {
  return /\d/.test(value.trim());
}

export function hasConfirmedActor(actors: readonly ActorDescriptor[]): boolean {
  return actors.some((actor) => actor.origin === "Asserted");
}

export function mergeUniqueStrings(existing: readonly string[], incoming: readonly string[]): string[] {
  const seen = new Set(existing.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0));
  const merged = [...existing];

  for (const value of incoming) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(trimmed);
  }

  return merged;
}

export function structuredBriefFromDocument(
  document: {
    readonly structuredBrief?: Partial<ArchitectureDraftStructuredBriefState> | null;
  } | null | undefined,
): ArchitectureDraftStructuredBriefState {
  const brief = document?.structuredBrief;

  if (brief === null || brief === undefined) {
    return emptyArchitectureDraftStructuredBrief();
  }

  return {
    confirmedConstraints: [...(brief.confirmedConstraints ?? [])],
    confirmedAssumptions: [...(brief.confirmedAssumptions ?? [])],
    confirmedRequiredCapabilities: [...(brief.confirmedRequiredCapabilities ?? [])],
    suggestedConstraints: [...(brief.suggestedConstraints ?? [])],
    suggestedAssumptions: [...(brief.suggestedAssumptions ?? [])],
    suggestedRequiredCapabilities: [...(brief.suggestedRequiredCapabilities ?? [])],
    qualityAttribute: brief.qualityAttribute ?? "",
    failureModeNote: brief.failureModeNote ?? "",
    operationalOwner: brief.operationalOwner ?? "",
  };
}

export function structuredBriefToPatchPayload(
  brief: ArchitectureDraftStructuredBriefState,
): NonNullable<DraftRequestDocument["structuredBrief"]> {
  return {
    confirmedConstraints: [...brief.confirmedConstraints],
    confirmedAssumptions: [...brief.confirmedAssumptions],
    confirmedRequiredCapabilities: [...brief.confirmedRequiredCapabilities],
    suggestedConstraints: [...brief.suggestedConstraints],
    suggestedAssumptions: [...brief.suggestedAssumptions],
    suggestedRequiredCapabilities: [...brief.suggestedRequiredCapabilities],
    qualityAttribute: brief.qualityAttribute.trim(),
    failureModeNote: brief.failureModeNote.trim(),
    operationalOwner: brief.operationalOwner.trim(),
  };
}
