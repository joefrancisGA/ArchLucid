import { afterEach, describe, expect, it, vi } from "vitest";

import {
  consumePendingCommandPaletteOpen,
  requestCommandPaletteOpen,
  resetPendingCommandPaletteOpenForTests,
} from "@/lib/command-palette-open-intent";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/lib/shortcut-registry";

const preloadCommandPaletteChunk = vi.hoisted(() => vi.fn());

vi.mock("@/components/CommandPaletteLazy", () => ({
  preloadCommandPaletteChunk,
}));

describe("command-palette-open-intent (LD-08)", () => {
  afterEach(() => {
    resetPendingCommandPaletteOpenForTests();
    vi.clearAllMocks();
  });

  it("queues open intent and preloads the palette chunk", () => {
    preloadCommandPaletteChunk.mockResolvedValue(() => null);
    const listener = vi.fn();

    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, listener);

    requestCommandPaletteOpen();

    expect(preloadCommandPaletteChunk).toHaveBeenCalledTimes(1);
    expect(consumePendingCommandPaletteOpen()).toEqual({});
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, listener);
  });

  it("seeds initial query on queued open intent", () => {
    preloadCommandPaletteChunk.mockResolvedValue(() => null);

    requestCommandPaletteOpen("  ingress  ");

    expect(consumePendingCommandPaletteOpen()).toEqual({ initialQuery: "ingress" });
  });
});
