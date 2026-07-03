import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCommandPaletteChunkPreload } from "@/hooks/use-command-palette-chunk-preload";

const preloadCommandPaletteChunk = vi.hoisted(() => vi.fn());

vi.mock("@/components/CommandPaletteLazy", () => ({
  preloadCommandPaletteChunk,
}));

describe("useCommandPaletteChunkPreload", () => {
  beforeEach(() => {
    preloadCommandPaletteChunk.mockResolvedValue(() => null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("preloads the command palette chunk on Ctrl+K outside editable fields", () => {
    renderHook(() => useCommandPaletteChunkPreload());

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
    );

    expect(preloadCommandPaletteChunk).toHaveBeenCalledTimes(1);
  });

  it("preloads on Meta+K for macOS", () => {
    renderHook(() => useCommandPaletteChunkPreload());

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );

    expect(preloadCommandPaletteChunk).toHaveBeenCalledTimes(1);
  });

  it("does not preload when focus is in an input", () => {
    renderHook(() => useCommandPaletteChunkPreload());
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
    );

    expect(preloadCommandPaletteChunk).not.toHaveBeenCalled();
    input.remove();
  });
});
