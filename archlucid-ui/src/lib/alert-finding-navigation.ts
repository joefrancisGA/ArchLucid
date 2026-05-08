import type { AlertRecord } from "@/types/alerts";

/** Deep-link to structured finding detail when the alert row carries {@link AlertRecord.primaryFindingId}. */
export function alertPrimaryFindingDetailHref(alert: AlertRecord): string | null {
  const runId: string = alert.runId?.trim() ?? "";
  const findingId: string = alert.primaryFindingId?.trim() ?? "";

  if (runId.length === 0 || findingId.length === 0) {
    return null;
  }

  return `/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}`;
}
