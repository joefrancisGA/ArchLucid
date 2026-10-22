import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

/** Read-only executive sponsor link for a finalized review. */
export function buildExecutiveSponsorLink(runId: string, origin: string): string {
  const trimmedRunId = runId.trim();
  const url = new URL(SPONSOR_REPORT_PATH, origin);
  url.searchParams.set("runId", trimmedRunId);

  return url.toString();
}
