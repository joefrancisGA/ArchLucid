const STORAGE_KEY_PREFIX = "archlucid-review-assumption-ack:";
const CHANGE_EVENT_NAME = "archlucid-review-assumption-ack-changed";

function storageKeyForRun(runId: string): string {
  return `${STORAGE_KEY_PREFIX}${runId.trim()}`;
}

/** Read persisted assumption acknowledgements for a review run (TB-2314). */
export function readAcknowledgedAssumptionIds(runId: string): ReadonlySet<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(storageKeyForRun(runId));

    if (raw === null || raw.trim().length === 0) {
      return new Set();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return new Set();
    }

    const ids = parsed.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);

    return new Set(ids);
  } catch {
    return new Set();
  }
}

/** Persist assumption acknowledgements and notify other strips / finalize gates on the same page. */
export function writeAcknowledgedAssumptionIds(runId: string, ids: ReadonlySet<string>): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKeyForRun(runId), JSON.stringify([...ids]));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT_NAME, { detail: { runId: runId.trim() } }));
}

/** Subscribe to acknowledgement changes for one run (same-tab only). */
export function subscribeAssumptionAckChanges(runId: string, listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const trimmedRunId = runId.trim();

  function onChange(event: Event): void {
    const detail = (event as CustomEvent<{ runId?: string }>).detail;

    if (detail?.runId === trimmedRunId) {
      listener();
    }
  }

  window.addEventListener(CHANGE_EVENT_NAME, onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT_NAME, onChange);
  };
}
