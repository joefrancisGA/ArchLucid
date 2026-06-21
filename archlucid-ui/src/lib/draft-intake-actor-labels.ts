import type {
  ActorDescriptor,
  ActorKind,
  ActorOrigin,
  InteractionContract,
  TrustOrigin,
} from "@/types/draft-intake";

export const ACTOR_KIND_OPTIONS: ReadonlyArray<{ value: ActorKind; label: string }> = [
  { value: "Human", label: "Human" },
  { value: "Machine", label: "Machine" },
  { value: "Both", label: "Human and machine" },
];

export const TRUST_ORIGIN_OPTIONS: ReadonlyArray<{ value: TrustOrigin; label: string }> = [
  { value: "Internal", label: "Internal (employees / trusted staff)" },
  { value: "External", label: "External (authenticated partners or customers)" },
  { value: "PublicAnonymous", label: "Public / anonymous" },
];

const INTERACTION_CONTRACT_BASE: ReadonlyArray<{ value: InteractionContract; label: string }> = [
  { value: "Sync", label: "Synchronous (interactive UI or API)" },
  { value: "AsyncBatch", label: "Async batch" },
  { value: "Event", label: "Event-driven" },
  { value: "Streaming", label: "Streaming" },
];

const HUMAN_SYNC_LABEL = "Interactive UI (synchronous)";
const MACHINE_SYNC_LABEL = "Synchronous API";
const BOTH_SYNC_LABEL = "Interactive UI and synchronous API";

/** Buyer-facing interaction labels scoped by actor kind (ADR 0049 contract axis). */
export function getInteractionContractOptions(
  actorKind: ActorKind,
): ReadonlyArray<{ value: InteractionContract; label: string }> {
  return INTERACTION_CONTRACT_BASE.map((option) => {
    if (option.value !== "Sync") {
      return option;
    }

    if (actorKind === "Human") {
      return { value: option.value, label: HUMAN_SYNC_LABEL };
    }

    if (actorKind === "Machine") {
      return { value: option.value, label: MACHINE_SYNC_LABEL };
    }

    return { value: option.value, label: BOTH_SYNC_LABEL };
  });
}

/** @deprecated Prefer getInteractionContractOptions(actorKind) for kind-scoped labels. */
export const INTERACTION_CONTRACT_OPTIONS = INTERACTION_CONTRACT_BASE;

export function actorOriginLabel(origin: ActorOrigin): string {
  if (origin === "Asserted") {
    return "Confirmed";
  }

  return "Suggested";
}

/** Buyer-facing actor card title — surfaces suggested vs confirmed provenance. */
export function formatActorCardHeading(
  actor: ActorDescriptor,
  index: number,
): string {
  const label = actor.label?.trim() ?? "";
  const provenanceSuffix = actor.origin === "Inferred" ? " — suggested" : "";

  if (label.length > 0) {
    return `Actor: ${label}${provenanceSuffix}`;
  }

  return `Actor ${index + 1}${provenanceSuffix}`;
}

/** Compact label for suggested-actor checkboxes. */
export function formatSuggestedActorLabel(actor: ActorDescriptor): string {
  const label = actor.label?.trim() ?? "";

  if (label.length > 0) {
    return label;
  }

  return `${actor.kind} · ${actor.trustOrigin} · ${actor.contract}`;
}
