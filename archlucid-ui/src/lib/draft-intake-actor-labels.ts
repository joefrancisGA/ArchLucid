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

const NON_SYNC_INTERACTION_OPTIONS: ReadonlyArray<{ value: InteractionContract; label: string }> = [
  { value: "AsyncBatch", label: "Async batch" },
  { value: "Event", label: "Event-driven" },
  { value: "Streaming", label: "Streaming" },
];

/** Only Sync varies by kind — a person waits at a screen, a machine waits on a response. */
const SYNC_LABEL_BY_ACTOR_KIND: Readonly<Record<ActorKind, string>> = {
  Human: "Interactive UI",
  Machine: "API call — caller waits for the response",
  Both: "Interactive UI and API — caller waits",
};

/** Buyer-facing interaction labels scoped by actor kind (ADR 0049 contract axis). */
export function getInteractionContractOptions(
  actorKind: ActorKind,
): ReadonlyArray<{ value: InteractionContract; label: string }> {
  return [
    { value: "Sync", label: SYNC_LABEL_BY_ACTOR_KIND[actorKind] },
    ...NON_SYNC_INTERACTION_OPTIONS,
  ];
}

export function actorOriginLabel(origin: ActorOrigin): string {
  if (origin === "Asserted") {
    return "Confirmed";
  }

  return "Suggested";
}

/** Buyer-facing actor card title — surfaces suggested vs confirmed provenance. */
export type ActorCardHeadingParts = {
  /** Scan key shown before the value (`Actor` or `Actor 2`). */
  readonly keyLabel: string;
  /** Whether to render a trailing colon after {@link keyLabel}. */
  readonly keyHasColon: boolean;
  /** Actor display name; empty when falling back to numbering. */
  readonly valueText: string;
  /** Provenance suffix such as ` — suggested`. */
  readonly provenanceSuffix: string;
};

export function resolveActorCardHeadingParts(
  actor: ActorDescriptor,
  index: number,
): ActorCardHeadingParts {
  const label = actor.label?.trim() ?? "";
  const provenanceSuffix = actor.origin === "Inferred" ? " — suggested" : "";

  if (label.length > 0) {
    return {
      keyLabel: "Actor",
      keyHasColon: true,
      valueText: label,
      provenanceSuffix,
    };
  }

  return {
    keyLabel: `Actor ${index + 1}`,
    keyHasColon: false,
    valueText: "",
    provenanceSuffix,
  };
}

export function formatActorCardHeading(
  actor: ActorDescriptor,
  index: number,
): string {
  const parts = resolveActorCardHeadingParts(actor, index);

  if (parts.valueText.length > 0) {
    return `Actor: ${parts.valueText}${parts.provenanceSuffix}`;
  }

  return `${parts.keyLabel}${parts.provenanceSuffix}`;
}

/** Compact label for suggested-actor checkboxes. */
export function formatSuggestedActorLabel(actor: ActorDescriptor): string {
  const label = actor.label?.trim() ?? "";

  if (label.length > 0) {
    return label;
  }

  return `${actor.kind} · ${actor.trustOrigin} · ${actor.contract}`;
}
