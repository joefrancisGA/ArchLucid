/** Estimates seconds remaining from bytes sent so far; null when not yet computable. */
export function estimateUploadSecondsRemaining(
  loadedBytes: number,
  totalBytes: number,
  startedAtMs: number,
  nowMs: number,
): number | null {
  if (totalBytes <= 0 || loadedBytes <= 0) {
    return null;
  }

  const elapsedSeconds = (nowMs - startedAtMs) / 1000;

  if (elapsedSeconds <= 0) {
    return null;
  }

  const bytesPerSecond = loadedBytes / elapsedSeconds;

  if (bytesPerSecond <= 0) {
    return null;
  }

  const remainingBytes = totalBytes - loadedBytes;

  if (remainingBytes <= 0) {
    return 0;
  }

  return Math.ceil(remainingBytes / bytesPerSecond);
}

/** Human-readable ETA for upload progress UI. */
export function formatUploadEta(seconds: number | null): string | null {
  if (seconds === null) {
    return null;
  }

  if (seconds <= 0) {
    return "Finishing…";
  }

  if (seconds < 60) {
    return `About ${seconds} second${seconds === 1 ? "" : "s"} remaining`;
  }

  const minutes = Math.ceil(seconds / 60);

  return `About ${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
}
