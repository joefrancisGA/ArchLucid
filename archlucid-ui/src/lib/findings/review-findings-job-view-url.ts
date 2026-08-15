import {
  DEFAULT_FINDING_JOB_VIEW,
  FINDING_JOB_VIEW_LABELS,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { REVIEW_DETAIL_TAB_PARAM } from "@/lib/review-detail-workspace-tabs";

/** Query param for findings workspace job-view filter (TB-2179 deep links). */
export const REVIEW_FINDINGS_JOB_VIEW_PARAM = "findingJobView";

const FINDING_JOB_VIEW_ALLOWLIST: ReadonlySet<string> = new Set(Object.keys(FINDING_JOB_VIEW_LABELS));

export function isFindingJobViewSearchParam(value: string | null | undefined): value is FindingJobView {
  return typeof value === "string" && FINDING_JOB_VIEW_ALLOWLIST.has(value);
}

export function resolveFindingJobViewFromSearchParam(value: string | null | undefined): FindingJobView {
  if (isFindingJobViewSearchParam(value)) {
    return value;
  }

  return DEFAULT_FINDING_JOB_VIEW;
}

export function buildReviewFindingsTabHref(
  runId: string,
  jobView?: FindingJobView,
): string {
  const trimmedRunId = runId.trim();
  const params = new URLSearchParams({ [REVIEW_DETAIL_TAB_PARAM]: "findings" });

  if (jobView !== undefined && jobView !== DEFAULT_FINDING_JOB_VIEW) {
    params.set(REVIEW_FINDINGS_JOB_VIEW_PARAM, jobView);
  }

  return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}?${params.toString()}`;
}

/** Persists job-view filter in the address bar without a Next.js soft navigation. */
export function writeFindingJobViewToUrl(jobView: FindingJobView): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (jobView === DEFAULT_FINDING_JOB_VIEW) {
    url.searchParams.delete(REVIEW_FINDINGS_JOB_VIEW_PARAM);
  } else {
    url.searchParams.set(REVIEW_FINDINGS_JOB_VIEW_PARAM, jobView);
  }

  window.history.replaceState(null, "", url.toString());
}

export function readFindingJobViewFromWindowLocation(): FindingJobView {
  if (typeof window === "undefined") {
    return DEFAULT_FINDING_JOB_VIEW;
  }

  return resolveFindingJobViewFromSearchParam(
    new URLSearchParams(window.location.search).get(REVIEW_FINDINGS_JOB_VIEW_PARAM),
  );
}
