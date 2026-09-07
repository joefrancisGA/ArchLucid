"use client";

import { useEffect } from "react";

import {
  COMMAND_PALETTE_FINALIZE_REVIEW_EVENT,
  COMMAND_PALETTE_FINDING_ACCEPT_EVENT,
  COMMAND_PALETTE_FINDING_NEXT_EVENT,
  COMMAND_PALETTE_FINDING_PREVIOUS_EVENT,
  COMMAND_PALETTE_FINDING_REJECT_EVENT,
  COMMAND_PALETTE_FINDING_REMEDIATE_EVENT,
  COMMAND_PALETTE_ROOM_ELICITATION_EVENT,
  COMMAND_PALETTE_SAVE_DRAFT_EVENT,
  COMMAND_PALETTE_UNDO_MUTATION_EVENT,
} from "@/lib/command-palette-handler-actions";
import {
  queryVisibleArchitectureDraftSaveControl,
  queryVisibleFinalizeReviewControl,
  queryVisibleReviewDetailSaveControl,
  queryVisibleReviewRoomEnterControl,
} from "@/lib/command-palette-work-action-dom";
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

function clickVisibleSaveControl(): void {
  const architectureSave = queryVisibleArchitectureDraftSaveControl();

  if (architectureSave !== null) {
    architectureSave.click();

    return;
  }

  const reviewSave = queryVisibleReviewDetailSaveControl();

  if (reviewSave !== null) {
    reviewSave.click();
  }
}

function clickVisibleFinalizeReviewControl(): void {
  queryVisibleFinalizeReviewControl()?.click();
}

function clickVisibleRoomElicitationControl(): void {
  queryVisibleReviewRoomEnterControl()?.click();
}

function isFindingKeyboardTriageHostMounted(): boolean {
  return document.querySelector("[data-finding-keyboard-triage-host]") !== null;
}

/** Bridges palette handler actions to existing on-page controls without duplicating API calls (PT-06). */
export function CommandPaletteWorkActionBridge(): null {
  useEffect(() => {
    const onSaveDraft = () => {
      clickVisibleSaveControl();
    };

    const onFinalizeReview = () => {
      clickVisibleFinalizeReviewControl();
    };

    const onRoomElicitation = () => {
      clickVisibleRoomElicitationControl();
    };

    const onUndoMutation = () => {
      clickVisibleUndoControl();
    };

    const onFindingNext = () => {
      if (isFindingKeyboardTriageHostMounted()) {
        return;
      }

      focusAdjacentFindingCard(1);
    };

    const onFindingPrevious = () => {
      if (isFindingKeyboardTriageHostMounted()) {
        return;
      }

      focusAdjacentFindingCard(-1);
    };

    const onFindingAccept = () => {
      if (isFindingKeyboardTriageHostMounted()) {
        return;
      }

      dispatchFocusedFindingDispositionShortcut(FINDING_CARD_SHORTCUT_DISPOSITIONS.alt1);
    };

    const onFindingRemediate = () => {
      if (isFindingKeyboardTriageHostMounted()) {
        return;
      }

      dispatchFocusedFindingDispositionShortcut(FINDING_CARD_SHORTCUT_DISPOSITIONS.alt2);
    };

    const onFindingReject = () => {
      if (isFindingKeyboardTriageHostMounted()) {
        return;
      }

      dispatchFocusedFindingDispositionShortcut(FINDING_CARD_SHORTCUT_DISPOSITIONS.alt3);
    };

    window.addEventListener(COMMAND_PALETTE_SAVE_DRAFT_EVENT, onSaveDraft);
    window.addEventListener(COMMAND_PALETTE_FINALIZE_REVIEW_EVENT, onFinalizeReview);
    window.addEventListener(COMMAND_PALETTE_ROOM_ELICITATION_EVENT, onRoomElicitation);
    window.addEventListener(COMMAND_PALETTE_UNDO_MUTATION_EVENT, onUndoMutation);
    window.addEventListener(COMMAND_PALETTE_FINDING_NEXT_EVENT, onFindingNext);
    window.addEventListener(COMMAND_PALETTE_FINDING_PREVIOUS_EVENT, onFindingPrevious);
    window.addEventListener(COMMAND_PALETTE_FINDING_ACCEPT_EVENT, onFindingAccept);
    window.addEventListener(COMMAND_PALETTE_FINDING_REMEDIATE_EVENT, onFindingRemediate);
    window.addEventListener(COMMAND_PALETTE_FINDING_REJECT_EVENT, onFindingReject);

    return () => {
      window.removeEventListener(COMMAND_PALETTE_SAVE_DRAFT_EVENT, onSaveDraft);
      window.removeEventListener(COMMAND_PALETTE_FINALIZE_REVIEW_EVENT, onFinalizeReview);
      window.removeEventListener(COMMAND_PALETTE_ROOM_ELICITATION_EVENT, onRoomElicitation);
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
