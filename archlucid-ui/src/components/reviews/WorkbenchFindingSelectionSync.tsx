"use client";

import { useEffect, useRef } from "react";

import { useReviewWorkbenchSelection } from "@/components/reviews/ReviewWorkbenchSelectionContext";
import { writeReviewDetailFindingIdToUrl } from "@/lib/review-detail-workspace-tabs";

/** Applies selected-finding visual state to finding cards in the workbench findings column (PT-12). */
export function WorkbenchFindingSelectionSync(): null {
  const selection = useReviewWorkbenchSelection();
  const selectedFindingId = selection?.selectedFindingId ?? null;
  const reconcileSelectedFindingId = selection?.reconcileSelectedFindingId;
  const clearedStaleFindingIdRef = useRef<string | null>(null);

  useEffect(() => {
    const selectedId = selectedFindingId;
    const cards = document.querySelectorAll<HTMLElement>("[data-finding-id]");
    let effectiveSelectedId = selectedId;

    if (selectedId !== null && selectedId.trim().length > 0 && cards.length > 0) {
      const exists = Array.from(cards).some((card) => (card.getAttribute("data-finding-id") ?? "") === selectedId);

      if (!exists) {
        if (clearedStaleFindingIdRef.current !== selectedId) {
          clearedStaleFindingIdRef.current = selectedId;
          // Stamp unselected before clearing: parent initialFindingId effects can
          // overwrite the null write in the same flush, so fail-closed must not wait
          // for a second selectedFindingId render (LI-13).
          effectiveSelectedId = null;
          writeReviewDetailFindingIdToUrl(null);
          reconcileSelectedFindingId?.(null);
        } else {
          effectiveSelectedId = null;
        }
      } else {
        clearedStaleFindingIdRef.current = null;
      }
    } else if (selectedId === null) {
      clearedStaleFindingIdRef.current = null;
    }

    for (const card of cards) {
      const findingId = card.getAttribute("data-finding-id") ?? "";
      const selected = effectiveSelectedId !== null && findingId === effectiveSelectedId;

      card.setAttribute("data-workbench-selected", selected ? "true" : "false");

      if (selected) {
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
        card.focus({ preventScroll: true });
      }
    }
  }, [reconcileSelectedFindingId, selectedFindingId]);

  return null;
}
