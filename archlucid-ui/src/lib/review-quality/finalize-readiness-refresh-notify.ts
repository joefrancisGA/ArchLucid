const FINALIZE_READINESS_REFRESH_EVENT = "archlucid:finalize-readiness-refresh";

export function subscribeFinalizeReadinessRefresh(
  runId: string,
  listener: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const normalizedRunId = runId.trim();

  if (normalizedRunId.length === 0) {
    return () => {};
  }

  const handler = (event: Event): void => {
    const detail = (event as CustomEvent<{ readonly runId?: string }>).detail;

    if (detail?.runId !== normalizedRunId) {
      return;
    }

    listener();
  };

  window.addEventListener(FINALIZE_READINESS_REFRESH_EVENT, handler);

  return () => {
    window.removeEventListener(FINALIZE_READINESS_REFRESH_EVENT, handler);
  };
}

export function notifyFinalizeReadinessRefresh(runId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedRunId = runId.trim();

  if (normalizedRunId.length === 0) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(FINALIZE_READINESS_REFRESH_EVENT, {
      detail: { runId: normalizedRunId },
    }),
  );
}
