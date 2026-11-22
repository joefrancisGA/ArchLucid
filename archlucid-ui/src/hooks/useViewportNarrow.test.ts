import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useViewportNarrow } from "@/hooks/useViewportNarrow";

describe("useViewportNarrow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("syncs narrow state from matchMedia and reacts to breakpoint changes", async () => {
    const listeners = new Set<() => void>();
    const mediaQueryList = {
      matches: true,
      media: "(max-width: 1023px)",
      addEventListener: (_event: string, listener: () => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_event: string, listener: () => void) => {
        listeners.delete(listener);
      },
    } as MediaQueryList;

    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mediaQueryList));

    const { result } = renderHook(() => useViewportNarrow());
    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    act(() => {
      mediaQueryList.matches = false;

      for (const listener of listeners) {
        listener();
      }
    });

  });
});
