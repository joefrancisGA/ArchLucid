import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CommandPaletteWorkActionBridge } from "@/components/shell/CommandPaletteWorkActionBridge";
import {
  COMMAND_PALETTE_FINALIZE_REVIEW_EVENT,
  COMMAND_PALETTE_SAVE_DRAFT_EVENT,
} from "@/lib/command-palette-handler-actions";

describe("CommandPaletteWorkActionBridge (LD-09)", () => {
  it("clicks visible finalize and review save controls", () => {
    const finalizeClick = vi.fn();
    const dispositionSaveClick = vi.fn();

    document.body.innerHTML = `
      <button data-testid="commit-run-finalize" type="button">Finalize review</button>
      <button data-testid="finding-disposition-save" type="button">Save disposition</button>
    `;

    document.querySelector<HTMLButtonElement>('[data-testid="commit-run-finalize"]')!.onclick = finalizeClick;
    document.querySelector<HTMLButtonElement>('[data-testid="finding-disposition-save"]')!.onclick =
      dispositionSaveClick;

    render(<CommandPaletteWorkActionBridge />);

    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_FINALIZE_REVIEW_EVENT));
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_SAVE_DRAFT_EVENT));

    expect(finalizeClick).toHaveBeenCalledTimes(1);
    expect(dispositionSaveClick).toHaveBeenCalledTimes(1);
  });
});
