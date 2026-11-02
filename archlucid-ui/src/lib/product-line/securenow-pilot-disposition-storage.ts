export const SECURENOW_PILOT_DISPOSITION_STORAGE_PREFIX = "securenow-pilot-disposition:" as const;

export const SECURENOW_PILOT_DISPOSITION_STORAGE_DISCIPLINE =
  "Stored in this browser for this workspace. It does not clear beta NO_GO." as const;

export type SecureNowPilotDispositionRecord = {
  readonly outcome: string;
  readonly rationale: string;
};

export function secureNowPilotDispositionStorageKey(pathId: string): string {
  return `${SECURENOW_PILOT_DISPOSITION_STORAGE_PREFIX}${pathId.trim()}`;
}

export function readSecureNowPilotDisposition(pathId: string): SecureNowPilotDispositionRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmedPathId = pathId.trim();

  if (trimmedPathId.length === 0) {
    return null;
  }

  const stored = window.localStorage.getItem(secureNowPilotDispositionStorageKey(trimmedPathId));

  if (stored === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as { outcome?: string; rationale?: string };
    const outcome = parsed.outcome?.trim() ?? "";
    const rationale = parsed.rationale?.trim() ?? "";

    if (outcome.length === 0 || rationale.length === 0) {
      return null;
    }

    return { outcome, rationale };
  } catch {
    window.localStorage.removeItem(secureNowPilotDispositionStorageKey(trimmedPathId));
    return null;
  }
}

export function writeSecureNowPilotDisposition(
  pathId: string,
  record: SecureNowPilotDispositionRecord,
): void {
  window.localStorage.setItem(
    secureNowPilotDispositionStorageKey(pathId),
    JSON.stringify(record),
  );
}
