/** Compact elapsed duration for inline UI suffixes (audit trail, queue status). */
export function formatElapsedCompactSeconds(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));

  if (sec < 60) {
    return `${sec}s`;
  }

  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;

  if (minutes < 60) {
    if (seconds === 0) {
      return `${minutes}m`;
    }

    return `${minutes}m ${seconds}s`;
  }

  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

/** Prefixes compact elapsed time for audit-trail deltas (e.g. "+17h 40m 43s"). */
export function formatElapsedSincePreviousPrefix(totalSeconds: number): string {
  return `+${formatElapsedCompactSeconds(totalSeconds)}`;
}
