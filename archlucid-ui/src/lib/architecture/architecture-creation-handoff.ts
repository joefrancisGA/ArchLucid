const STORAGE_PREFIX = "archlucid_architecture_creation_handoff_v1_";

export type ArchitectureCreationHandoffPersonOrSystem = {
  readonly label: string;
  readonly kind: string;
};

/** Browser-session snapshot captured when create-architecture intake spawns a run. */
export type ArchitectureCreationHandoffSnapshot = {
  readonly runId: string;
  readonly recordedAtUtc: string;
  readonly architectureName: string;
  readonly architectureOverview: string;
  readonly businessOutcome: string;
  readonly peopleAndSystems: readonly ArchitectureCreationHandoffPersonOrSystem[];
};

function storageKey(runId: string): string {
  return `${STORAGE_PREFIX}${runId.trim()}`;
}

export function recordArchitectureCreationHandoff(
  snapshot: Omit<ArchitectureCreationHandoffSnapshot, "recordedAtUtc">,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmedRunId = snapshot.runId.trim();

  if (trimmedRunId.length === 0) {
    return;
  }

  const record: ArchitectureCreationHandoffSnapshot = {
    ...snapshot,
    recordedAtUtc: new Date().toISOString(),
  };

  try {
    window.sessionStorage.setItem(storageKey(trimmedRunId), JSON.stringify(record));
  } catch {
    /* private mode / quota */
  }
}

export function readArchitectureCreationHandoff(
  runId: string,
): ArchitectureCreationHandoffSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey(trimmedRunId));

    if (raw === null || raw.length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (parsed === null || typeof parsed !== "object" || !("runId" in parsed)) {
      return null;
    }

    const row = parsed as Record<string, unknown>;
    const peopleAndSystems = Array.isArray(row.peopleAndSystems)
      ? row.peopleAndSystems
          .filter((entry): entry is Record<string, unknown> => entry !== null && typeof entry === "object")
          .map((entry) => ({
            label: String(entry.label ?? "").trim(),
            kind: String(entry.kind ?? "").trim(),
          }))
          .filter((entry) => entry.label.length > 0)
      : [];

    return {
      runId: String(row.runId ?? trimmedRunId),
      recordedAtUtc: String(row.recordedAtUtc ?? ""),
      architectureName: String(row.architectureName ?? "").trim(),
      architectureOverview: String(row.architectureOverview ?? "").trim(),
      businessOutcome: String(row.businessOutcome ?? "").trim(),
      peopleAndSystems,
    };
  } catch {
    return null;
  }
}

export function clearArchitectureCreationHandoff(runId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey(trimmedRunId));
  } catch {
    /* ignore */
  }
}
