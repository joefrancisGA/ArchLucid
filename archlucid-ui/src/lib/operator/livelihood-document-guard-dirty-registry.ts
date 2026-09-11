/** Tracks active in-app navigation guards so scope switches can prompt before tenant writes (LW-078). */

type LivelihoodDocumentGuardDirtyListener = () => void;

let activeGuardCount = 0;
const listeners = new Set<LivelihoodDocumentGuardDirtyListener>();

function notifyLivelihoodDocumentGuardDirtyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function registerLivelihoodDocumentGuardDirty(): () => void {
  activeGuardCount += 1;
  notifyLivelihoodDocumentGuardDirtyListeners();

  return () => {
    activeGuardCount = Math.max(0, activeGuardCount - 1);
    notifyLivelihoodDocumentGuardDirtyListeners();
  };
}

export function hasActiveLivelihoodDocumentGuardDirty(): boolean {
  return activeGuardCount > 0;
}

export function subscribeLivelihoodDocumentGuardDirty(
  listener: LivelihoodDocumentGuardDirtyListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function clearLivelihoodDocumentGuardDirtyRegistryForTests(): void {
  activeGuardCount = 0;
  notifyLivelihoodDocumentGuardDirtyListeners();
}
