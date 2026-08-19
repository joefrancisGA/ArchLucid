import {
  clearAllPersistedInFlightOperations,
  readPersistedInFlightOperations,
  writePersistedInFlightOperations,
} from "@/lib/operations/in-flight-operations-persistence";
import type { OperationState } from "@/lib/operations/operation-state";

export type TrackedInFlightOperation = {
  readonly operationId: string;
  /** Buyer-facing title — prefer architecture review / export wording. */
  readonly title: string;
  /** Deep link when the operator is elsewhere at terminal. */
  readonly href: string;
  readonly startedAtMs: number;
  readonly stepLabel: string;
  readonly state: OperationState;
  readonly runId: string | null;
  /** Prevents duplicate terminal toasts when pollers remount. */
  readonly terminalToastShown: boolean;
};

type Listener = () => void;

let tracked: TrackedInFlightOperation[] = [];
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Mutations go through here so the persisted copy never drifts from the in-memory list. */
function commit(next: readonly TrackedInFlightOperation[]): void {
  tracked = [...next];
  writePersistedInFlightOperations(tracked);
  emit();
}

/**
 * Restores operations recorded before a reload. Call from a client effect (never during render)
 * so the `useSyncExternalStore` server snapshot and first client snapshot stay identical.
 */
export function hydrateInFlightOperationsFromStorage(): void {
  const persisted = readPersistedInFlightOperations();

  if (persisted.length === 0) {
    return;
  }

  const known = new Set(tracked.map((row) => row.operationId));
  const restored = persisted.filter((row) => !known.has(row.operationId));

  if (restored.length === 0) {
    return;
  }

  tracked = [...tracked, ...restored];
  emit();
}

/** Drops every tracked operation and its persisted copy — sign-out and scope switch. */
export function clearInFlightOperations(): void {
  clearAllPersistedInFlightOperations();

  if (tracked.length === 0) {
    return;
  }

  tracked = [];
  emit();
}

export function getInFlightOperations(): readonly TrackedInFlightOperation[] {
  return tracked;
}

export function subscribeInFlightOperations(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export type TrackInFlightOperationInput = {
  readonly operationId: string;
  readonly title: string;
  readonly href: string;
  readonly stepLabel?: string;
  readonly state?: OperationState;
  readonly runId?: string | null;
  readonly startedAtMs?: number;
};

/** Registers or refreshes an in-flight operation (idempotent on operationId). */
export function trackInFlightOperation(input: TrackInFlightOperationInput): void {
  const operationId = input.operationId.trim();

  if (operationId.length === 0) {
    return;
  }

  const existingIndex = tracked.findIndex((row) => row.operationId === operationId);
  const next: TrackedInFlightOperation = {
    operationId,
    title: input.title,
    href: input.href,
    startedAtMs: input.startedAtMs ?? Date.now(),
    stepLabel: input.stepLabel ?? "Queued",
    state: input.state ?? "Pending",
    runId: input.runId ?? null,
    terminalToastShown: existingIndex >= 0 ? tracked[existingIndex]!.terminalToastShown : false,
  };

  if (existingIndex >= 0) {
    const previous = tracked[existingIndex]!;
    commit([
      ...tracked.slice(0, existingIndex),
      {
        ...next,
        startedAtMs: previous.startedAtMs,
        terminalToastShown: previous.terminalToastShown,
      },
      ...tracked.slice(existingIndex + 1),
    ]);

    return;
  }

  commit([...tracked, next]);
}

export type PatchInFlightOperationInput = {
  readonly stepLabel?: string;
  readonly state?: OperationState;
  readonly runId?: string | null;
  readonly href?: string;
  readonly terminalToastShown?: boolean;
};

export function patchInFlightOperation(
  operationId: string,
  patch: PatchInFlightOperationInput,
): void {
  const index = tracked.findIndex((row) => row.operationId === operationId);

  if (index < 0) {
    return;
  }

  const previous = tracked[index]!;
  commit([
    ...tracked.slice(0, index),
    {
      ...previous,
      stepLabel: patch.stepLabel ?? previous.stepLabel,
      state: patch.state ?? previous.state,
      runId: patch.runId !== undefined ? patch.runId : previous.runId,
      href: patch.href ?? previous.href,
      terminalToastShown: patch.terminalToastShown ?? previous.terminalToastShown,
    },
    ...tracked.slice(index + 1),
  ]);
}

export function removeInFlightOperation(operationId: string): void {
  const next = tracked.filter((row) => row.operationId !== operationId);

  if (next.length === tracked.length) {
    return;
  }

  commit(next);
}

/** Vitest helper — clear module state between cases. */
export function resetInFlightOperationsForTests(): void {
  clearAllPersistedInFlightOperations();
  tracked = [];
  emit();
}
