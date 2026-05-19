/** Formats API process uptime seconds for operator health dashboards. */
export function formatProcessUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return "—";
  }

  const total = Math.floor(seconds);

  if (total < 60) {
    return `${total}s`;
  }

  const minutes = Math.floor(total / 60);

  if (minutes < 60) {
    const remSec = total % 60;

    return remSec > 0 ? `${minutes}m ${remSec}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;

  if (hours < 48) {
    return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}
