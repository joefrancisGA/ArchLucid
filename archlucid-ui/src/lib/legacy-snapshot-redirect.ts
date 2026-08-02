import {
  getCanonicalReviewWorkspaceHref,
  getShowcaseExecutiveHref,
} from "@/lib/buyer-safe-review-navigation";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";

/**
 * Showcase Claims Intake spine (and legacy aliases) redirect to the canonical review workspace;
 * all other runs redirect to their tenant review workspace with `readOnly=1` (TB-1952).
 * Never `/sponsor-report/executive-summary` — leave-behind is read-only review chrome only.
 */
export function resolveSnapshotRedirectDestination(runId: string): string {
  if (isShowcaseStaticDemoRunId(runId)) {
    return getShowcaseExecutiveHref();
  }

  return getCanonicalReviewWorkspaceHref(runId);
}

/**
 * Builds the canonical review workspace path plus `readOnly=1` and preserved inbound query params
 * (for example `v=demo` from CTO recap leave-behind links).
 */
export function buildSnapshotRedirectPath(
  runId: string,
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const u = new URL("http://local");
  u.pathname = resolveSnapshotRedirectDestination(runId);
  u.searchParams.set("readOnly", "1");

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        u.searchParams.append(key, entry);
      }
    } else {
      u.searchParams.set(key, value);
    }
  }

  return `${u.pathname}${u.search}`;
}
