import {
  reviewsHubLifecycleStage,
  reviewsHubOverallStatus,
} from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-review-status";
import type { RunSummary } from "@/types/authority";

export type ReviewPinStampStatus = {
  readonly overallStatus: string;
  readonly lifecycleStage: string;
  readonly sealed: boolean;
};

export function resolveReviewPinStampStatus(run: RunSummary): ReviewPinStampStatus {
  return {
    overallStatus: reviewsHubOverallStatus(run),
    lifecycleStage: reviewsHubLifecycleStage(run),
    sealed: run.hasGoldenManifest === true,
  };
}

export function reviewPinStampStatusLine(status: ReviewPinStampStatus): string {
  if (status.sealed) {
    return `Sealed · ${status.overallStatus}`;
  }

  return `${status.lifecycleStage} · ${status.overallStatus}`;
}
