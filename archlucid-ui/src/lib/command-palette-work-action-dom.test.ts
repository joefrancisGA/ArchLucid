import { describe, expect, it } from "vitest";

import {
  isCommandPaletteFinalizeReviewAvailable,
  isCommandPaletteReviewSaveAvailable,
  queryVisibleFinalizeReviewControl,
  queryVisibleReviewDetailSaveControl,
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
});
