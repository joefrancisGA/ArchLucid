import {
  architectureIdentityPath,
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

export type WorkingBackHrefTarget = {
  readonly reviewJobHref: string;
  readonly architectureDeskHref: string | null;
};

function trimmedArchitectureId(architectureId: string | null | undefined): string | null {
  const trimmed = architectureId?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/** AO-44: nested review job URL for Working deep-page back links. */
export function resolveWorkingReviewJobBackHref(
  reviewId: string,
  architectureId?: string | null,
  reviewTab?: ReviewDetailTabId,
): string {
  const base = resolveArchitectureReviewHref(reviewId, architectureId);

  if (reviewTab === undefined) {
    return base;
  }

  const architecture = trimmedArchitectureId(architectureId);
  const tabParamName = architecture !== null ? "reviewTab" : "tab";
  const params = new URLSearchParams({ [tabParamName]: reviewTab });

  return `${base}?${params.toString()}`;
}

/** Review job + architecture desk targets for governance-style return links (AO-44). */
export function resolveWorkingBackHrefTarget(
  reviewId: string,
  architectureId?: string | null,
): WorkingBackHrefTarget {
  const architecture = trimmedArchitectureId(architectureId);

  return {
    reviewJobHref: resolveArchitectureReviewHref(reviewId, architecture),
    architectureDeskHref: architecture !== null ? architectureIdentityPath(architecture) : null,
  };
}

/** Finding detail deep link — nested when architecture id is known (AO-44). */
export function resolveWorkingFindingDetailHref(
  reviewId: string,
  findingId: string,
  architectureId?: string | null,
  findingsQueueRunId?: string | null,
): string {
  const nestedReview = resolveArchitectureReviewHref(reviewId, architectureId);
  const encFinding = encodeURIComponent(findingId.trim());
  const base = `${nestedReview}/findings/${encFinding}`;
  const queueRunId = (findingsQueueRunId ?? "").trim();

  if (queueRunId.length === 0) {
    return base;
  }

  return `${base}?runId=${encodeURIComponent(queueRunId)}`;
}

/** Evidence-trace deep link — nested when architecture id is known (AO-44). */
export function resolveWorkingFindingEvidenceTraceHref(
  reviewId: string,
  findingId: string,
  architectureId?: string | null,
  findingsQueueRunId?: string | null,
): string {
  const nestedReview = resolveArchitectureReviewHref(reviewId, architectureId);
  const encFinding = encodeURIComponent(findingId.trim());
  const base = `${nestedReview}/findings/${encFinding}/evidence-trace`;
  const queueRunId = (findingsQueueRunId ?? "").trim();

  if (queueRunId.length === 0) {
    return base;
  }

  return `${base}?runId=${encodeURIComponent(queueRunId)}`;
}

/** Print view back link — nested review package tab when architecture id is known (AO-44). */
export function resolveWorkingPrintBackHref(
  reviewId: string,
  architectureId?: string | null,
): string {
  return resolveWorkingReviewJobBackHref(reviewId, architectureId, "review-package");
}
