import type { AdvisoryHubTabId } from "@/lib/advisory-hub-tab";
import { scopedRunIdFromQuery } from "@/lib/architecture/architecture-risk-register-page";

/** Builds `/governance/advisory-scans` hrefs while preserving optional `runId` deep-link scope. */
export function buildAdvisoryHubHref(input: {
  readonly pathname?: string;
  readonly tab?: AdvisoryHubTabId;
  readonly runId?: string | null;
}): string {
  const pathname = input.pathname?.trim() || "/governance/advisory-scans";
  const params = new URLSearchParams();
  const tab = input.tab ?? "scans";
  const runId = scopedRunIdFromQuery(input.runId);

  // Always carry `?tab=` so shared and traffic deep links survive tab selection (TB-1565 / TB-1505).
  params.set("tab", tab);

  if (runId !== null) {
    params.set("runId", runId);
  }

  const query = params.toString();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
}
