import { formatRelativeTime } from "@/lib/relative-time";
import { runListPrimaryTitle } from "@/components/operator-home/runs-dashboard-helpers";
import type { RunSummary } from "@/types/authority";

function formatRunStartedLabel(run: RunSummary): string | null {
  const createdUtc = run.createdUtc?.trim() ?? "";

  if (createdUtc.length === 0) {
    return null;
  }

  return `Started ${formatRelativeTime(createdUtc)}`;
}

/** Adds relative start time when multiple visible rows share the same buyer-facing title. */
export function formatRunListTitleWithDisambiguator(
  run: RunSummary,
  siblingRuns: readonly RunSummary[],
): string {
  const title = runListPrimaryTitle(run);
  const duplicateTitleCount = siblingRuns.filter((candidate) => runListPrimaryTitle(candidate) === title).length;

  if (duplicateTitleCount <= 1) {
    return title;
  }

  const startedLabel = formatRunStartedLabel(run);

  if (startedLabel === null) {
    const runId = run.runId?.trim() ?? "";

    if (runId.length >= 4) {
      return `${title} · ${runId.slice(-6)}`;
    }

    return title;
  }

  return `${title} · ${startedLabel}`;
}
