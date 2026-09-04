import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceModeContext } from "@/components/WorkspaceModeProvider";
import { useTeachingChromeVisible } from "@/lib/workspace-mode/use-teaching-chrome-visible";

describe("useTeachingChromeVisible (LI-14/LI-15)", () => {
  it("returns false in Working mode", () => {
    const { result } = renderHook(() => useTeachingChromeVisible(), {
      wrapper: ({ children }) => (
        <WorkspaceModeContext.Provider
          value={{
            mode: "working",
            mounted: true,
            accountSyncState: "synced",
            isWorkingMode: true,
            setAndPersist: vi.fn(),
          }}
        >
          {children}
        </WorkspaceModeContext.Provider>
      ),
    });

    expect(result.current).toBe(false);
  });

  it("returns false when presenter mode is active", () => {
    window.history.replaceState({}, "", "/architecture/reviews/run-1?presenter=1");

    const { result } = renderHook(() => useTeachingChromeVisible(), {
      wrapper: ({ children }) => (
        <WorkspaceModeContext.Provider
          value={{
            mode: "guided",
            mounted: true,
            accountSyncState: "synced",
            isWorkingMode: false,
            setAndPersist: vi.fn(),
          }}
        >
          {children}
        </WorkspaceModeContext.Provider>
      ),
    });

    expect(result.current).toBe(false);
  });
});
