import type { RunSummary } from "@/types/authority";

/** Prefer API-provided display labels — avoids leaking slug identifiers into sponsor-facing pickers. */
export function runSummaryDisplayLabel(row: Pick<RunSummary, "runId" | "displayName" | "description">): string {
  const displayName = row.displayName?.trim() ?? "";

  if (displayName.length > 0) {
    return displayName;
  }

  const description = row.description?.trim() ?? "";

  if (description.length > 0) {
    return description;
  }

  return row.runId.trim();
}
