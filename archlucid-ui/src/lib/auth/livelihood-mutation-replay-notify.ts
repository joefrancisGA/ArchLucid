import type { LivelihoodPendingMutation } from "@/lib/auth/livelihood-mutation-401-resume";

export type LivelihoodMutationReplayedEvent = {
  readonly pending: LivelihoodPendingMutation;
  readonly result: unknown;
};

type LivelihoodMutationReplayedListener = (event: LivelihoodMutationReplayedEvent) => void;

const listeners = new Set<LivelihoodMutationReplayedListener>();

export function subscribeLivelihoodMutationReplayed(
  listener: LivelihoodMutationReplayedListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function notifyLivelihoodMutationReplayed(event: LivelihoodMutationReplayedEvent): void {
  for (const listener of listeners) {
    listener(event);
  }
}
