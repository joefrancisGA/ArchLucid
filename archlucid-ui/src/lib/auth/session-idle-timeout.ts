/** Enterprise idle timeout — must stay aligned with {@link SessionIdleTimeoutGuard}. */
export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;

export const SESSION_IDLE_TIMEOUT_MINUTES = SESSION_IDLE_TIMEOUT_MS / (60 * 1000);

/** Warn this many milliseconds before clearing the session. */
export const SESSION_IDLE_WARNING_MS = 2 * 60 * 1000;

/** Shared cross-tab activity timestamp (ISO string). */
export const SESSION_LAST_ACTIVITY_STORAGE_KEY = "archlucid.session.lastActivityAt";

/** ISO timestamp written when idle timeout clears the operator session. */
export const SESSION_CLEARED_AT_STORAGE_KEY = "archlucid.session.clearedAt";

/** Broadcast channel for cross-tab idle coordination. */
export const SESSION_IDLE_BROADCAST_CHANNEL = "archlucid.session.idle";

export function readSharedSessionLastActivityAtMs(): number {
  if (typeof window === "undefined") {
    return Date.now();
  }

  try {
    const raw = window.localStorage.getItem(SESSION_LAST_ACTIVITY_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return Date.now();
    }

    const parsed = Date.parse(raw);

    if (Number.isNaN(parsed)) {
      return Date.now();
    }

    return parsed;
  }
  catch {
    return Date.now();
  }
}

export function writeSharedSessionLastActivityAt(nowMs: number = Date.now()): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SESSION_LAST_ACTIVITY_STORAGE_KEY, new Date(nowMs).toISOString());
  }
  catch {
    /* ignore */
  }
}

export function remainingSessionIdleMs(lastActivityAtMs: number, nowMs: number = Date.now()): number {
  const elapsed = nowMs - lastActivityAtMs;

  return Math.max(0, SESSION_IDLE_TIMEOUT_MS - elapsed);
}
