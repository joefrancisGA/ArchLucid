import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCommandPaletteChunkPreload } from "@/hooks/use-command-palette-chunk-preload";
import {
  consumePendingCommandPaletteOpen,
  resetPendingCommandPaletteOpenForTests,
} from "@/lib/command-palette-open-intent";

const preloadCommandPaletteChunk = vi.hoisted(() => vi.fn());
const palettePressUsesPaletteModifier = vi.hoisted(() => vi.fn(() => true));

vi.mock("@/components/CommandPaletteLazy", () => ({
  preloadCommandPaletteChunk,
}));

vi.mock("@/components/CommandPalette", () => ({
  palettePressUsesPaletteModifier,
}));

describe("useCommandPaletteChunkPreload", () => {
  beforeEach(() => {
    preloadCommandPaletteChunk.mockResolvedValue(() => null);
    palettePressUsesPaletteModifier.mockReturnValue(true);
  });

  afterEach(() => {
    resetPendingCommandPaletteOpenForTests();
    vi.clearAllMocks();
  });

  it("queues palette open and preloads on Ctrl+K outside editable fields (LD-08)", () => {
    renderHook(() => useCommandPaletteChunkPreload());

    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, "preventDefault");

    window.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(preloadCommandPaletteChunk).toHaveBeenCalledTimes(1);
    expect(consumePendingCommandPaletteOpen()).toEqual({});
  });

  it("preloads on Meta+K for macOS", () => {
    renderHook(() => useCommandPaletteChunkPreload());

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true, cancelable: true }),
    );

    expect(preloadCommandPaletteChunk).toHaveBeenCalledTimes(1);
    expect(consumePendingCommandPaletteOpen()).toEqual({});
  });

  it("does not open when the palette modifier guard rejects the target", () => {
    palettePressUsesPaletteModifier.mockReturnValue(false);
    renderHook(() => useCommandPaletteChunkPreload());

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }),
    );

    expect(preloadCommandPaletteChunk).not.toHaveBeenCalled();
    expect(consumePendingCommandPaletteOpen()).toBeNull();
  });
});
