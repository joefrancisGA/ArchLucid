/** Formats pipeline duration for metric tiles (null/NaN → em dash). */
export function formatPilotValueReportAvgCompletion(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) {
    return "—";
  }

  if (seconds >= 3600) {
    return `${(seconds / 3600).toFixed(1)} h`;
  }

  if (seconds >= 60) {
    return `${(seconds / 60).toFixed(1)} min`;
  }

  return `${seconds.toFixed(0)} s`;
}
