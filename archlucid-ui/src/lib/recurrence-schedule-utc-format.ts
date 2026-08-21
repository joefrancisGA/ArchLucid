/** Formats an ISO UTC timestamp for operator recurrence schedule surfaces. */
export function formatRecurrenceScheduleUtcLabel(utc: string | null | undefined): string {
  if (!utc) {
    return " — ";
  }

  const parsed = new Date(utc);

  if (Number.isNaN(parsed.getTime())) {
    return utc;
  }

  return (
    parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC"
  );
}
