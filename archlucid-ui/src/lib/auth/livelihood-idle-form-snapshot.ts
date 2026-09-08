/** In-memory registry of dirty livelihood forms — flushed into idle restore on session clear (WS-18). */
export type LivelihoodIdleFormSnapshot = {
  readonly surfaceId: string;
  readonly returnPath: string;
  readonly entityKey: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly savedAtUtc: string;
};

const registry = new Map<string, LivelihoodIdleFormSnapshot>();

type LivelihoodIdleFormSnapshotRegistryListener = () => void;

const registryListeners = new Set<LivelihoodIdleFormSnapshotRegistryListener>();

function notifyLivelihoodIdleFormSnapshotRegistryListeners(): void {
  for (const listener of registryListeners) {
    listener();
  }
}

export function buildLivelihoodIdleFormSnapshotKey(surfaceId: string, entityKey: string): string {
  return `${surfaceId.trim()}:${entityKey.trim()}`;
}

export function registerLivelihoodIdleFormSnapshot(
  key: string,
  snapshot: LivelihoodIdleFormSnapshot | null,
): void {
  if (snapshot === null) {
    registry.delete(key);
    notifyLivelihoodIdleFormSnapshotRegistryListeners();

    return;
  }

  registry.set(key, snapshot);
  notifyLivelihoodIdleFormSnapshotRegistryListeners();
}

export function hasRegisteredLivelihoodIdleFormSnapshots(): boolean {
  return registry.size > 0;
}

export function subscribeLivelihoodIdleFormSnapshotRegistry(
  listener: LivelihoodIdleFormSnapshotRegistryListener,
): () => void {
  registryListeners.add(listener);

  return () => {
    registryListeners.delete(listener);
  };
}

export function collectRegisteredLivelihoodIdleFormSnapshots(): Readonly<Record<string, LivelihoodIdleFormSnapshot>> {
  return Object.fromEntries(registry.entries());
}

export function clearLivelihoodIdleFormSnapshotRegistryForTests(): void {
  registry.clear();
  notifyLivelihoodIdleFormSnapshotRegistryListeners();
}
