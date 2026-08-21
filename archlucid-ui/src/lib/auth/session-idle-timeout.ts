/** Enterprise idle timeout — must stay aligned with {@link SessionIdleTimeoutGuard}. */
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export const SESSION_IDLE_TIMEOUT_MINUTES = SESSION_IDLE_TIMEOUT_MS / (60 * 1000);

/** ISO timestamp written when idle timeout clears the operator session. */
export const SESSION_CLEARED_AT_STORAGE_KEY = "archlucid.session.clearedAt";
