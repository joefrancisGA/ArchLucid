import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";

/** Whether the viewer can open the review wizard without an auth handoff first. */
export function viewerCanStartReviewFromDemoExplain(): boolean {
  if (AUTH_MODE === "development-bypass") {
    return true;
  }

  if (!isJwtAuthMode()) {
    return true;
  }

  if (typeof sessionStorage === "undefined") {
    return false;
  }

  return isLikelySignedIn();
}
