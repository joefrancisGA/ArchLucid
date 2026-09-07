"use client";

import { useEffect } from "react";

import { useReviewDetailWorkspaceRoomElicitation } from "@/components/reviews/use-review-detail-workspace-room-elicitation";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { queryVisibleReviewRoomEnterControl } from "@/lib/command-palette-work-action-dom";

/** Alt+M toggles room elicitation on review-detail when the Room control is available (DR-16). */
export function ReviewRoomElicitationShortcutHost(): null {
  const { isWorkingMode } = useWorkspaceMode();
  const room = useReviewDetailWorkspaceRoomElicitation();

  useEffect(() => {
    if (!isWorkingMode) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key.toLowerCase() !== "m") {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (queryVisibleReviewRoomEnterControl() === null) {
        return;
      }

      event.preventDefault();
      room.toggleRoomElicitation();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isWorkingMode, room]);

  return null;
}
