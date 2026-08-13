"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";

/**
 * Tracks `/architecture/reviews/[runId]` navigation (excluding `/architecture/reviews/new`) and stores the active run id for downstream pickers (Ask / Graph).
 * Also accepts legacy `/reviews/...`, `/sponsor/reviews/...`, and `/runs/...` bookmarks.
 */
export function SyncActiveRunFromPathname(): null {
  const pathname = usePathname();
  const ctx = useWorkspaceActiveRun();

  useEffect(() => {
    if (ctx === null) {
      return;
    }

    const executiveMatch = /^\/sponsor\/reviews\/([^/]+)/.exec(pathname);
    const reviewMatch = /^\/architecture\/reviews\/([^/]+)/.exec(pathname);
    const legacyReviewsMatch = /^\/reviews\/([^/]+)/.exec(pathname);
    const legacyRunsMatch = /^\/runs\/([^/]+)/.exec(pathname);
    const segment = (
      executiveMatch?.[1] ?? reviewMatch?.[1] ?? legacyReviewsMatch?.[1] ?? legacyRunsMatch?.[1]
    )?.trim();

    if (!segment || segment.length === 0 || segment === "new") {
      return;
    }

    ctx.setActiveRunId(segment);
  }, [ctx, pathname]);

  return null;
}
