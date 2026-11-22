import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHelpPanel } from "@/components/use-help-panel";
import { useAppShellState } from "@/hooks/use-app-shell-state";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => true,
}));

vi.mock("@/lib/workspace-mode/use-teaching-chrome-visible", () => ({
  useTeachingChromeVisible: () => false,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

function visitHelpUrl(search: string): void {
  act(() => {
    window.history.replaceState({}, "", `/architecture/reviews${search}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

describe("Help-panel URL history synchronization", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/architecture/reviews?help=1&helpTab=shortcuts");
  });

  it("returns the open Guides drawer to its default tab when helpTab disappears", () => {
    const { result } = renderHook(() =>
      useHelpPanel({ open: true, onOpenChange: vi.fn() }),
    );

    expect(result.current.tab).toBe("shortcuts");

    visitHelpUrl("?help=1");

    expect(result.current.tab).toBe("guides");
  });

  it("resets the parent shell initial tab when the URL no longer specifies helpTab", () => {
    const { result } = renderHook(() => useAppShellState());

    expect(result.current.helpGuidesOpen).toBe(true);
    expect(result.current.helpGuidesInitialTab).toBe("shortcuts");

    visitHelpUrl("?help=1");

    expect(result.current.helpGuidesInitialTab).toBe("guides");
  });

  it("continues to honor an explicitly bookmarked non-default tab", () => {
    const { result } = renderHook(() =>
      useHelpPanel({ open: true, onOpenChange: vi.fn() }),
    );

    visitHelpUrl("?help=1&helpTab=troubleshooting");

    expect(result.current.tab).toBe("troubleshooting");
  });
});
