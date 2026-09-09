"use client";

import { useEffect } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { queryVisibleReviewRoomEnterControl } from "@/lib/command-palette-work-action-dom";

/** Alt+M activates the visible Room control on review-detail or architecture draft desk (DR-16). */
export function ReviewRoomElicitationShortcutHost(): null {
  const { isWorkingMode } = useWorkspaceMode();

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

      const roomControl = queryVisibleReviewRoomEnterControl();

      if (roomControl === null) {
        return;
      }

      event.preventDefault();
      roomControl.click();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isWorkingMode]);

  return null;
}
