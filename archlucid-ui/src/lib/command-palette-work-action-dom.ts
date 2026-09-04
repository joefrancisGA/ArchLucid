/** Visible architecture draft save controls (CommandPaletteWorkActionBridge). */
export function queryVisibleArchitectureDraftSaveControl(): HTMLButtonElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const saveNow = document.querySelector<HTMLButtonElement>('[data-testid="architecture-save-draft-retry"]:not([disabled])');

  if (saveNow !== null) {
    return saveNow;
  }

  return document.querySelector<HTMLButtonElement>('[data-testid="architecture-save-and-exit"]:not([disabled])');
}

/** Visible review-detail save controls for guarded livelihood fields (LD-09). */
export function queryVisibleReviewDetailSaveControl(): HTMLButtonElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const dispositionSave = document.querySelector<HTMLButtonElement>(
    '[data-testid="finding-disposition-save"]:not([disabled])',
  );

  if (dispositionSave !== null) {
    return dispositionSave;
  }

  return document.querySelector<HTMLButtonElement>(
    '[data-testid="finding-remediation-save"]:not([disabled])',
  );
}

/** Finalize review CTA when the scorecard allows commit (LD-09 / TB-2005). */
export function queryVisibleFinalizeReviewControl(): HTMLButtonElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  return document.querySelector<HTMLButtonElement>('[data-testid="commit-run-finalize"]:not([disabled])');
}

export function isCommandPaletteReviewSaveAvailable(): boolean {
  return queryVisibleReviewDetailSaveControl() !== null;
}

export function isCommandPaletteFinalizeReviewAvailable(): boolean {
  return queryVisibleFinalizeReviewControl() !== null;
}
