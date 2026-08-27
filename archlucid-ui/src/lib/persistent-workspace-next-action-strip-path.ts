import {
  isArchitectureDraftPath,
  isReviewsPath,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import { isFirstReviewGuidePath } from "@/lib/first-review-guide-route";

function isReviewsSurfacePath(pathname: string): boolean {
  if (!isReviewsPath(pathname)) {
    return false;
  }

  if (pathname === REVIEWS_NEW_PATH || pathname.startsWith(`${REVIEWS_NEW_PATH}/`)) {
    return false;
  }

  return true;
}

/** Surfaces where the cross-page first-review progress strip may render. */
export function isPersistentWorkspaceNextActionStripPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  if (isReviewsSurfacePath(pathname)) {
    return true;
  }

  if (isArchitectureDraftPath(pathname)) {
    return true;
  }

  if (isFirstReviewGuidePath(pathname)) {
    return true;
  }

  return false;
}
