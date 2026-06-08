import type {
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

export const INTERACTION_CONTRACT_OPTIONS: ReadonlyArray<{ value: InteractionContract; label: string }> = [
  { value: "Sync", label: "Synchronous (interactive UI or API)" },
  { value: "AsyncBatch", label: "Async batch" },
  { value: "Event", label: "Event-driven" },
  { value: "Streaming", label: "Streaming" },
];

export function actorOriginLabel(origin: ActorOrigin): string {
  if (origin === "Asserted") {
    return "Confirmed";
  }

  return "Suggested";
}
