"use client";

import { useEffect } from "react";

import {
  COMMAND_PALETTE_SAVE_DRAFT_EVENT,
  COMMAND_PALETTE_UNDO_MUTATION_EVENT,
} from "@/lib/command-palette-handler-actions";

function clickVisibleUndoControl(): void {
  const undoButtons = document.querySelectorAll<HTMLButtonElement>(
    '[data-testid$="-undo"]:not([disabled])',
  );

  if (undoButtons.length === 0) {
    return;
  }

  undoButtons[0]?.click();
}

function clickArchitectureSaveDraftControl(): void {
  const saveNow = document.querySelector<HTMLButtonElement>('[data-testid="architecture-save-draft-retry"]');

  if (saveNow !== null && !saveNow.disabled) {
    saveNow.click();
    return;
  }

  const saveAndExit = document.querySelector<HTMLButtonElement>('[data-testid="architecture-save-and-exit"]');

  if (saveAndExit !== null && !saveAndExit.disabled) {
    saveAndExit.click();
  }
}

/** Bridges palette handler actions to existing on-page controls without duplicating API calls (PT-06). */
export function CommandPaletteWorkActionBridge(): null {
  useEffect(() => {
    const onSaveDraft = () => {
      clickArchitectureSaveDraftControl();
    };

    const onUndoMutation = () => {
      clickVisibleUndoControl();
    };

    window.addEventListener(COMMAND_PALETTE_SAVE_DRAFT_EVENT, onSaveDraft);
    window.addEventListener(COMMAND_PALETTE_UNDO_MUTATION_EVENT, onUndoMutation);

    return () => {
      window.removeEventListener(COMMAND_PALETTE_SAVE_DRAFT_EVENT, onSaveDraft);
      window.removeEventListener(COMMAND_PALETTE_UNDO_MUTATION_EVENT, onUndoMutation);
    };
  }, []);

  return null;
}
