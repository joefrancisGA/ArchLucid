const REVIEW_PIPELINE_COMPLETION_NOTIFIED_PREFIX = "archlucid:review-pipeline-complete-notified:";

function storageKey(runId: string): string {
  return `${REVIEW_PIPELINE_COMPLETION_NOTIFIED_PREFIX}${runId}`;
}

export function wasReviewPipelineCompletionNotified(runId: string): boolean {
  if (typeof window === "undefined" || runId.trim().length === 0) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(storageKey(runId)) === "1";
  } catch {
    return false;
  }
}

export function markReviewPipelineCompletionNotified(runId: string): void {
  if (typeof window === "undefined" || runId.trim().length === 0) {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey(runId), "1");
  } catch {
    /* sessionStorage may be unavailable */
  }
}
