/** Formats elapsed wall-clock for shell in-flight rows (no fake %). */

export function formatOperationElapsed(startedAtMs: number, nowMs: number): string {
  const elapsedSec = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));

  if (elapsedSec < 60) {
    return `${elapsedSec}s`;
  }

  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;

  if (minutes < 60) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;

  return `${hours}h ${remMinutes}m`;
}
