"use client";

import { useEffect } from "react";

import {
  COMMAND_PALETTE_FINDING_ACCEPT_EVENT,
  COMMAND_PALETTE_FINDING_NEXT_EVENT,
  COMMAND_PALETTE_FINDING_PREVIOUS_EVENT,
  COMMAND_PALETTE_FINDING_REJECT_EVENT,
  COMMAND_PALETTE_FINDING_REMEDIATE_EVENT,
  COMMAND_PALETTE_SAVE_DRAFT_EVENT,
  COMMAND_PALETTE_UNDO_MUTATION_EVENT,
} from "@/lib/command-palette-handler-actions";
import {
  dispatchFocusedFindingDispositionShortcut,
  FINDING_CARD_SHORTCUT_DISPOSITIONS,
  focusAdjacentFindingCard,
} from "@/hooks/useFindingCardShortcuts";

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

    const onFindingNext = () => {
      focusAdjacentFindingCard(1);
    };

    const onFindingPrevious = () => {
      focusAdjacentFindingCard(-1);
    };

    const onFindingAccept = () => {
      dispatchFocusedFindingDispositionShortcut(FINDING_CARD_SHORTCUT_DISPOSITIONS.alt1);
    };

    const onFindingRemediate = () => {
      dispatchFocusedFindingDispositionShortcut(FINDING_CARD_SHORTCUT_DISPOSITIONS.alt2);
    };

    const onFindingReject = () => {
      dispatchFocusedFindingDispositionShortcut(FINDING_CARD_SHORTCUT_DISPOSITIONS.alt3);
    };

    window.addEventListener(COMMAND_PALETTE_SAVE_DRAFT_EVENT, onSaveDraft);
    window.addEventListener(COMMAND_PALETTE_UNDO_MUTATION_EVENT, onUndoMutation);
    window.addEventListener(COMMAND_PALETTE_FINDING_NEXT_EVENT, onFindingNext);
    window.addEventListener(COMMAND_PALETTE_FINDING_PREVIOUS_EVENT, onFindingPrevious);
    window.addEventListener(COMMAND_PALETTE_FINDING_ACCEPT_EVENT, onFindingAccept);
    window.addEventListener(COMMAND_PALETTE_FINDING_REMEDIATE_EVENT, onFindingRemediate);
    window.addEventListener(COMMAND_PALETTE_FINDING_REJECT_EVENT, onFindingReject);

    return () => {
      window.removeEventListener(COMMAND_PALETTE_SAVE_DRAFT_EVENT, onSaveDraft);
      window.removeEventListener(COMMAND_PALETTE_UNDO_MUTATION_EVENT, onUndoMutation);
      window.removeEventListener(COMMAND_PALETTE_FINDING_NEXT_EVENT, onFindingNext);
      window.removeEventListener(COMMAND_PALETTE_FINDING_PREVIOUS_EVENT, onFindingPrevious);
      window.removeEventListener(COMMAND_PALETTE_FINDING_ACCEPT_EVENT, onFindingAccept);
      window.removeEventListener(COMMAND_PALETTE_FINDING_REMEDIATE_EVENT, onFindingRemediate);
      window.removeEventListener(COMMAND_PALETTE_FINDING_REJECT_EVENT, onFindingReject);
    };
  }, []);

  return null;
}
