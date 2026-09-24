import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileNavDrawer } from "@/components/MobileNavDrawer";

const commitHrefIfChanged = vi.hoisted(() => vi.fn(() => false));

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    commitHrefIfChanged,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/users",
}));

vi.mock("@/hooks/useOperatorShellNavRows", () => ({
  useOperatorShellNavRows: () => ({
    allRows: [],
    buyerPolishedShell: false,
    demoUi: false,
    effectiveHasCommittedArchitectureReview: false,
    effectiveOperateUnlockPhase: 0,
    roleNavDensityHiddenGroupCount: 0,
    roleNavDensityShowFullNav: true,
    toggleRoleNavDensityShowFullNav: vi.fn(),
  }),
}));

vi.mock("@/hooks/useArchitectWorkspaceChrome", () => ({
  useArchitectWorkspaceChrome: () => false,
}));

vi.mock("@/hooks/use-governance-mode", () => ({
  useGovernanceMode: () => ({ isGovernanceModeEnabled: false }),
}));

vi.mock("@/hooks/useSidebarNavGroupExpansion", () => ({
  useSidebarNavGroupExpansion: () => ({
    expansion: {},
    toggleGroupExpanded: vi.fn(),
    setGroupExpanded: vi.fn(),
  }),
}));

describe("MobileNavDrawer", () => {
  beforeEach(() => {
    commitHrefIfChanged.mockClear();
    window.history.replaceState(null, "", "/administration/users");
  });

  it("does not commit href churn when the drawer mounts closed", async () => {
    render(<MobileNavDrawer />);

    await waitFor(() => {
      expect(commitHrefIfChanged).not.toHaveBeenCalled();
    });
  });
});
