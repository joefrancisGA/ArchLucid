import { describe, expect, it } from "vitest";

import {
  isCommandPaletteCloneFromSnapshotAvailable,
  isCommandPaletteFinalizeReviewAvailable,
  isCommandPaletteReviewSaveAvailable,
  queryVisibleFinalizeReviewControl,
  queryVisibleReviewDetailSaveControl,
  queryVisibleSpawnLockCloneSnapshotControl,
} from "@/lib/command-palette-work-action-dom";

describe("command-palette-work-action-dom (LD-09)", () => {
  it("detects visible finalize and review save controls", () => {
    document.body.innerHTML = `
      <button data-testid="commit-run-finalize" type="button">Finalize review</button>
      <button data-testid="finding-disposition-save" type="button" disabled>Save disposition</button>
      <button data-testid="finding-remediation-save" type="button">Save remediation</button>
    `;

    expect(queryVisibleFinalizeReviewControl()).not.toBeNull();
    expect(isCommandPaletteFinalizeReviewAvailable()).toBe(true);
    expect(queryVisibleReviewDetailSaveControl()?.getAttribute("data-testid")).toBe("finding-remediation-save");
    expect(isCommandPaletteReviewSaveAvailable()).toBe(true);
  });

  it("SN-008: detects visible spawn-locked clone controls", () => {
    document.body.innerHTML = `
      <button data-testid="architecture-spawn-lock-clone-snapshot" type="button">Sketch a change</button>
    `;

    expect(queryVisibleSpawnLockCloneSnapshotControl()).not.toBeNull();
    expect(isCommandPaletteCloneFromSnapshotAvailable()).toBe(true);
  });
});
