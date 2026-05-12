"use client";

import {
  formatFindings,
  formatHours,
  formatMedianLlmCalls,
  safeCommittedRunWindowCount,
} from "@/components/BeforeAfterDelta/formatDelta";
import { useDeltaQuery } from "@/components/BeforeAfterDelta/useDeltaQuery";

/**
 * Compact proof-of-ROI strip for the /reviews header — median finalized-manifest time, findings, and attested LLM trace counts.
 */
export function RunsListProofHeadline() {
  const { status, data } = useDeltaQuery({ count: 5 });

  if (status !== "ready" || data === null) {
    return null;
  }

  const windowCount = safeCommittedRunWindowCount(data.returnedCount);

  if (windowCount === null || windowCount < 1) {
    return null;
  }

  if (!Array.isArray(data.items)) {
    return null;
  }

  const time = formatHours(data.medianTimeToCommittedManifestTotalSeconds);
  const findings = formatFindings(data.medianTotalFindings);
  const llm = formatMedianLlmCalls(data.medianLlmCallCount);

  return (
    <span
      className="text-neutral-600 dark:text-neutral-400"
      data-testid="runs-list-proof-headline"
      title="Medians across recent finalized reviews in scope (same endpoint as the proof-of-ROI panel below)."
    >
      <span className="font-medium text-neutral-800 dark:text-neutral-200">Proof snapshot: </span>
      {time} to manifest · {findings} findings · {llm} LLM calls (median)
    </span>
  );
}
