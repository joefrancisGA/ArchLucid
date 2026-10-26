import type { RunSummary } from "@/types/authority";

import { collectResumeRunIdsForMatch } from "@/lib/operator/operator-home-hero-resume-target";
import { resolveRunIdFromWorkingReviewHref } from "@/lib/system-not-job-portfolio-resume-href";
import type { UnfinishedWorkRailItem } from "@/lib/unfinished-work-rail";

const AWAITING_DISPOSITION_RAIL_ID_PREFIX = "awaiting-disposition:";
const REVIEW_IN_PROGRESS_RAIL_ID_PREFIX = "review-in-progress:";

/** Normalize OpenAPI / queue run id strings for Set membership (trim + drop empty). */
export function buildTrimmedRunIdSet(runIds: readonly string[]): ReadonlySet<string> {
  const normalized = new Set<string>();

  for (const runId of runIds) {
    const trimmed = runId.trim();

    if (trimmed.length > 0) {
      normalized.add(trimmed);
    }
  }

  return normalized;
}

/** Run id encoded in TB-2369 unfinished-work rail row ids (independent of href drift). */
export function resolveRunIdFromUnfinishedWorkRailItem(item: UnfinishedWorkRailItem): string | null {
  if (item.kind === "awaiting-disposition") {
    const runId = item.id.startsWith(AWAITING_DISPOSITION_RAIL_ID_PREFIX)
      ? item.id.slice(AWAITING_DISPOSITION_RAIL_ID_PREFIX.length).trim()
      : "";

    return runId.length > 0 ? runId : null;
  }

  if (item.kind === "review-in-progress") {
    const runId = item.id.startsWith(REVIEW_IN_PROGRESS_RAIL_ID_PREFIX)
      ? item.id.slice(REVIEW_IN_PROGRESS_RAIL_ID_PREFIX.length).trim()
      : "";

    return runId.length > 0 ? runId : null;
  }

  return null;
}

/** Canonical run id for TB-2369 rail rows (row id + href, with href winning on conflict). */
export function resolveUnfinishedWorkRailRunIdForMatch(item: UnfinishedWorkRailItem): string | null {
  if (item.kind !== "awaiting-disposition" && item.kind !== "review-in-progress") {
    return null;
  }

  const railRunId = resolveRunIdFromUnfinishedWorkRailItem(item)?.trim() ?? "";
  const hrefRunId = resolveRunIdFromWorkingReviewHref(item.href)?.trim() ?? "";

  if (railRunId.length > 0 && hrefRunId.length > 0 && railRunId !== hrefRunId) {
    const deskPath = (item.href.split("?")[0] ?? "").replace(/\/+$/, "");
    const hrefHighlightsReviewOnDesk =
      /^\/architecture\/architectures\/[^/]+/.test(deskPath) && item.href.includes("?");

    return hrefHighlightsReviewOnDesk ? hrefRunId : railRunId;
  }

  const runIds = collectResumeRunIdsForMatch(item.href, railRunId.length > 0 ? railRunId : null);

  return runIds[0] ?? null;
}

function isTb2369ReviewWorkRailItem(item: UnfinishedWorkRailItem): boolean {
  return item.kind === "awaiting-disposition" || item.kind === "review-in-progress";
}

function collectHomeAttentionExcludedRunIdsForRailItem(item: UnfinishedWorkRailItem): readonly string[] {
  if (!isTb2369ReviewWorkRailItem(item)) {
    return [];
  }

  const runIds = new Set<string>();
  const canonicalRunId = resolveUnfinishedWorkRailRunIdForMatch(item);

  if (canonicalRunId !== null) {
    runIds.add(canonicalRunId);
  }

  const railRowRunId = resolveRunIdFromUnfinishedWorkRailItem(item)?.trim() ?? "";

  if (railRowRunId.length > 0 && railRowRunId !== canonicalRunId) {
    runIds.add(railRowRunId);
  }

  const hrefRunId = resolveRunIdFromWorkingReviewHref(item.href)?.trim() ?? "";

  if (hrefRunId.length > 0 && hrefRunId !== canonicalRunId) {
    runIds.add(hrefRunId);
  }

  return [...runIds];
}

/** Run ids already surfaced on home unfinished-work rail rows (TB-2369). */
export function listHomeAttentionPreviewExcludedRunIds(
  unfinishedRailItems: readonly UnfinishedWorkRailItem[],
): readonly string[] {
  const runIds = new Set<string>();

  for (const item of unfinishedRailItems) {
    for (const runId of collectHomeAttentionExcludedRunIdsForRailItem(item)) {
      runIds.add(runId);
    }
  }

  return [...runIds];
}

/** Removes runs already shown on the unfinished-work rail from home attention previews. */
export function filterRunsForHomeAttentionPreview(
  runs: readonly RunSummary[],
  excludedRunIds: readonly string[],
): readonly RunSummary[] {
  if (excludedRunIds.length === 0) {
    return runs;
  }

  const excluded = buildTrimmedRunIdSet(excludedRunIds);

  return runs.filter((run) => {
    const runId = run.runId?.trim() ?? "";

    if (runId.length === 0) {
      return true;
    }

    return !excluded.has(runId);
  });
}
