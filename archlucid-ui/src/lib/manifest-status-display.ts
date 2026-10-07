import { projectReviewLifecycleForDisplay } from "@/lib/vocabulary/project-review-lifecycle-for-display";

/** Maps authority manifest status strings to operator-facing labels (`Committed` is API-internal). */
export function manifestStatusForDisplay(status: string | undefined | null): string {
  if ((status ?? "").trim().length === 0) {
    return "Status not returned";
  }

  return projectReviewLifecycleForDisplay({ manifestStatus: status }).manifestStatusLabel;
}

/** True when the run has a committed (finalized) golden manifest in authority terms. */
export function isReviewManifestFinalized(status: string | undefined | null): boolean {
  return /^committed$/i.test((status ?? "").trim());
}
