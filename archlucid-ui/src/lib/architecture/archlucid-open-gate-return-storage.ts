export type ArchLucidOpenGateReturnRecord = {
  readonly runId: string;
  readonly openGateLabel: string;
  readonly href: string;
  readonly recordedAtUtc: string;
};

const STORAGE_PREFIX = "archlucid-open-gate-return:" as const;

function storageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}${workspaceId.trim()}`;
}

export function readArchLucidOpenGateReturnRecord(workspaceId: string): ArchLucidOpenGateReturnRecord | null {
  if (typeof window === "undefined" || workspaceId.trim().length === 0) {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey(workspaceId));

  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ArchLucidOpenGateReturnRecord;

    if (
      typeof parsed.runId !== "string"
      || typeof parsed.openGateLabel !== "string"
      || typeof parsed.href !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeArchLucidOpenGateReturnRecord(
  workspaceId: string,
  record: ArchLucidOpenGateReturnRecord,
): void {
  if (typeof window === "undefined" || workspaceId.trim().length === 0) {
    return;
  }

  window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(record));
}
