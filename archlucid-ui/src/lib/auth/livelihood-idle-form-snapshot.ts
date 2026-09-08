/** In-memory registry of dirty livelihood forms — flushed into idle restore on session clear (WS-18). */
export type LivelihoodIdleFormSnapshot = {
  readonly surfaceId: string;
  readonly returnPath: string;
  readonly entityKey: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly savedAtUtc: string;
};

const registry = new Map<string, LivelihoodIdleFormSnapshot>();

export function buildLivelihoodIdleFormSnapshotKey(surfaceId: string, entityKey: string): string {
  return `${surfaceId.trim()}:${entityKey.trim()}`;
}

export function registerLivelihoodIdleFormSnapshot(
  key: string,
  snapshot: LivelihoodIdleFormSnapshot | null,
): void {
  if (snapshot === null) {
    registry.delete(key);

    return;
  }

  registry.set(key, snapshot);
}

export function collectRegisteredLivelihoodIdleFormSnapshots(): Readonly<Record<string, LivelihoodIdleFormSnapshot>> {
  return Object.fromEntries(registry.entries());
}

export function clearLivelihoodIdleFormSnapshotRegistryForTests(): void {
  registry.clear();
}
