"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  extractArchitectureDraftIdFromPathname,
  extractReviewIdFromPathname,
  persistDeskContinuityPatch,
} from "@/lib/desk-continuity-preference";
import {
  OPERATOR_RECENT_VIEWS_STORAGE_KEY,
  parseStoredRecentViews,
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
    const label = recentViewLabelFromPathname(pathname);

    if (label === null) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
      const state = parseStoredRecentViews(raw);
      const next = recordRecentView(state, {
        href,
        label,
        kind: recentViewKindFromPathname(pathname),
      });

      window.localStorage.setItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY, JSON.stringify(next));
    }
    catch {
      /* ignore storage failures */
    }

    if (!isWorkingMode) {
      return;
    }

    const reviewId = extractReviewIdFromPathname(pathname);
    const draftId = extractArchitectureDraftIdFromPathname(pathname);

    if (reviewId === null && draftId === null) {
      return;
    }

    void persistDeskContinuityPatch({
      lastOpenReviewId: reviewId,
      lastOpenDraftId: draftId,
      lastVisitWatermarkUtc: new Date().toISOString(),
    }).catch(() => {
      /* offline or unauthenticated */
    });
  }, [href, isWorkingMode, pathname]);

  return null;
}
