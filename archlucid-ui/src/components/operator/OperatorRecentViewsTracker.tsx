"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  extractArchitectureDraftIdFromPathname,
  extractArchitectureIdentityIdFromPathname,
  extractReviewIdFromPathname,
  persistDeskContinuityPatch,
  writeCachedLastOpenArchitectureId,
} from "@/lib/desk-continuity-preference";
import {
  persistRecentViewsState,
  readStoredRecentViewsState,
  recentViewKindFromPathname,
  recentViewLabelFromPathname,
  recordRecentView,
} from "@/lib/operator/operator-recent-views";

/** Records the current route in localStorage for {@link OperatorRecentViewsPanel}. */
export function OperatorRecentViewsTracker(): null {
  const pathname = usePathname() ?? "/";
  const { isWorkingMode } = useWorkspaceMode();
  const search = typeof window !== "undefined" ? window.location.search : "";

  const href = useMemo(() => {
    const query = search.trim();

    return query.length > 0 ? `${pathname}${query}` : pathname;
  }, [pathname, search]);

  useEffect(() => {
    const label = recentViewLabelFromPathname(pathname, search);

    if (label === null) {
      return;
    }

    try {
      const state = readStoredRecentViewsState();
      const architectureId = extractArchitectureIdentityIdFromPathname(pathname, search);
      const next = recordRecentView(state, {
        href,
        label,
        kind: recentViewKindFromPathname(pathname, search),
        ...(architectureId !== null ? { architectureId } : {}),
      });

      persistRecentViewsState(next);
    }
    catch {
      /* ignore storage failures */
    }

    if (!isWorkingMode) {
      return;
    }

    const reviewId = extractReviewIdFromPathname(pathname);
    const draftId = extractArchitectureDraftIdFromPathname(pathname);
    const architectureId = extractArchitectureIdentityIdFromPathname(pathname, search);

    if (architectureId !== null) {
      writeCachedLastOpenArchitectureId(architectureId);
    }

    if (reviewId === null && draftId === null && architectureId === null) {
      return;
    }

    void persistDeskContinuityPatch({
      lastOpenArchitectureId: architectureId,
      lastOpenReviewId: reviewId,
      lastOpenDraftId: draftId,
      lastVisitWatermarkUtc: new Date().toISOString(),
    }).catch(() => {
      /* offline or unauthenticated */
    });
  }, [href, isWorkingMode, pathname, search]);

  return null;
}
