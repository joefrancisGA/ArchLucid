import {
  getCanonicalReviewWorkspaceHref,
  getShowcaseExecutiveHref,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";

/**
 * Showcase Claims Intake spine (and legacy aliases) use the canonical review workspace;
 * all other runs use their tenant review workspace path (never sponsor-report executive summary).
 */
export function resolveReadOnlyReviewWorkspacePath(runId: string): string {
  if (isShowcaseStaticDemoRunId(runId)) {
    return getShowcaseExecutiveHref();
  }

  return getCanonicalReviewWorkspaceHref(runId);
}

/**
 * Builds the canonical review workspace path plus `readOnly=1` and optional query params
 * (for example `v=demo` on CTO recap leave-behind links).
 */
export function buildReadOnlyReviewWorkspaceHref(
  runId: string,
  searchParams: Record<string, string | string[] | undefined> = {},
): string {
  const u = new URL("http://local");
  u.pathname = resolveReadOnlyReviewWorkspacePath(runId);
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
