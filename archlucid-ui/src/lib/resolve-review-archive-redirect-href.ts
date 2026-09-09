import { ARCHITECTURES_LIST_PATH, REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

/** SY-92 — archive returns to the architecture portfolio on Working, not the reviews inbox. */
export function resolveReviewArchiveRedirectHref(workingMode: boolean): string {
  if (workingMode) {
    return ARCHITECTURES_LIST_PATH;
  }

  return REVIEWS_LIST_PATH;
}
