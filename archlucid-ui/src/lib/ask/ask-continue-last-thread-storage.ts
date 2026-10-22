export const ASK_CONTINUE_LAST_THREAD_STORAGE_KEY = "archlucid_ask_continue_last_thread_v1";

export function readAskContinueLastThreadId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ASK_CONTINUE_LAST_THREAD_STORAGE_KEY)?.trim() ?? "";

    return raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function writeAskContinueLastThreadId(threadId: string): void {
  const normalized = threadId.trim();

  if (normalized.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(ASK_CONTINUE_LAST_THREAD_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}
