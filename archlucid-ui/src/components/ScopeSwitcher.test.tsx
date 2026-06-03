import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Same values as `@/lib/scope` dev defaults (avoid vi.mock hoisting issues). */
const DEV_TENANT = "11111111-1111-1111-1111-111111111111";
const DEV_WORKSPACE = "22222222-2222-2222-2222-222222222222";
const DEV_PROJECT = "33333333-3333-3333-3333-333333333333";

const demoUiEnvMock = vi.hoisted(() => ({
  buyerPolishedShell: false,
  demoMode: false,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 2,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoUiEnvMock.buyerPolishedShell,
    isNextPublicDemoMode: () => demoUiEnvMock.demoMode,
  };
});

vi.mock("@/lib/operator-scope-storage", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator-scope-storage")>();

  return {
    ...mod,
    getEffectiveBrowserProxyScopeHeaders: vi.fn(() => ({
      "x-tenant-id": DEV_TENANT,
      "x-workspace-id": DEV_WORKSPACE,
      "x-project-id": DEV_PROJECT,
    })),
    readOperatorScopeFromStorage: vi.fn(() => null),
  };
});

import { BUYER_WORKSPACE_DISPLAY_NAME } from "@/lib/buyer-polish-copy";

import { ScopeSwitcher } from "@/components/ScopeSwitcher";

describe("ScopeSwitcher — operator shell", () => {
  beforeEach(() => {
    demoUiEnvMock.buyerPolishedShell = false;
    demoUiEnvMock.demoMode = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ workspaces: [] }), { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows workspace labels on the trigger when effective scope is dev defaults", () => {
    render(<ScopeSwitcher />);
    const trigger = screen.getByTestId("operator-scope-switcher-trigger");

    expect(trigger).toHaveTextContent("Claims Intake Workspace");
    expect(trigger).toHaveTextContent("Primary project");
  });

  it("opens the panel without raw scope header ids and surfaces guidance when list is empty", async () => {
    render(<ScopeSwitcher />);
    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-switcher-panel")).toBeInTheDocument();
    });

    expect(screen.queryByText(/x-tenant-id/i)).not.toBeInTheDocument();
    expect(await screen.findByTestId("operator-scope-list-note")).toHaveTextContent(/sample workspace remains active/i);
  });

  it("lists the Claims Intake sample workspace when demo mode and API list is empty", async () => {
    demoUiEnvMock.demoMode = true;

    render(<ScopeSwitcher />);
    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    expect(await screen.findByRole("button", { name: "Primary project" })).toBeInTheDocument();
    expect(screen.queryByTestId("operator-scope-list-note")).not.toBeInTheDocument();
  });
});

describe("ScopeSwitcher — buyer-polished shell", () => {
  beforeEach(() => {
    demoUiEnvMock.buyerPolishedShell = true;
    demoUiEnvMock.demoMode = true;
  });

  afterEach(() => {
    demoUiEnvMock.buyerPolishedShell = false;
    demoUiEnvMock.demoMode = false;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows a read-only sample workspace chip without opening a technical scope panel", () => {
    render(<ScopeSwitcher />);

    const trigger = screen.getByTestId("operator-scope-switcher-trigger");

    expect(trigger).toHaveTextContent("Claims Intake Workspace");
    expect(trigger).toHaveAttribute("aria-label", `Active workspace: ${BUYER_WORKSPACE_DISPLAY_NAME}`);
    expect(screen.queryByTestId("operator-scope-switcher-panel")).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.queryByTestId("operator-scope-switcher-panel")).not.toBeInTheDocument();
    expect(screen.queryByText(/x-tenant-id/i)).not.toBeInTheDocument();
  });
});
