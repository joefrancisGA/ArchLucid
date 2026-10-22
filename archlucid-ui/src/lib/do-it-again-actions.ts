import {
  REVIEW_LIFECYCLE_NEXT_ACTION_REGISTRY,
  type ReviewLifecycleNextActionId,
  type ReviewLifecycleNextActionPhase,
  reviewLifecycleNextActionLabel,
} from "@/lib/review-lifecycle-next-action-registry";

export type DoItAgainFamilyId = "compare" | "validate" | "recurrence" | "start-another";

export type DoItAgainAction = {
  readonly familyId: DoItAgainFamilyId;
  readonly registryId: ReviewLifecycleNextActionId;
  readonly label: string;
  readonly whenToUse: string;
};

const DO_IT_AGAIN_REGISTRY_ID_BY_FAMILY: Record<DoItAgainFamilyId, ReviewLifecycleNextActionId> = {
  compare: "compare",
  validate: "validate-replay",
  recurrence: "schedule-recurrence",
  "start-another": "second-review",
};

const DO_IT_AGAIN_WHEN_TO_USE: Record<DoItAgainFamilyId, string> = {
  compare: "Diff two architecture packages side by side.",
  validate: "Re-check a single finalized architecture package.",
  recurrence: "Automate follow-up reviews on a repeating cadence.",
  "start-another": "Run a follow-up architecture review when the team is ready.",
};

const DO_IT_AGAIN_FAMILY_ORDER: readonly DoItAgainFamilyId[] = [
  "start-another",
  "compare",
  "recurrence",
  "validate",
] as const;

function registryEntrySupportsPhase(
  registryId: ReviewLifecycleNextActionId,
  phase: ReviewLifecycleNextActionPhase,
): boolean {
  const entry = REVIEW_LIFECYCLE_NEXT_ACTION_REGISTRY.find((row) => row.id === registryId);

  if (entry === undefined) {
    return false;
  }

  return entry.phases.includes(phase);
}

/** TB-2359 — one do-it-again family keyed to review lifecycle registry ids. */
export function listDoItAgainActions(phase: ReviewLifecycleNextActionPhase): readonly DoItAgainAction[] {
  const actions: DoItAgainAction[] = [];

  for (const familyId of DO_IT_AGAIN_FAMILY_ORDER) {
    const registryId = DO_IT_AGAIN_REGISTRY_ID_BY_FAMILY[familyId];

    if (!registryEntrySupportsPhase(registryId, phase)) {
      continue;
    }

    actions.push({
      familyId,
      registryId,
      label: reviewLifecycleNextActionLabel(registryId),
      whenToUse: DO_IT_AGAIN_WHEN_TO_USE[familyId],
    });
  }

  return actions;
}

export function doItAgainRegistryId(familyId: DoItAgainFamilyId): ReviewLifecycleNextActionId {
  return DO_IT_AGAIN_REGISTRY_ID_BY_FAMILY[familyId];
}
