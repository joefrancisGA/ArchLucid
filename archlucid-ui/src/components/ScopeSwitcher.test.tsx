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

import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_BODY,
  BUYER_SCOPE_SAMPLE_WORKSPACE_TITLE,
  BUYER_SCOPE_SWITCHER_CONTINUE,
  BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES,
} from "@/lib/buyer-polish-copy";

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

  it("shows a buyer-safe sample workspace label without W:/P: shorthand", () => {
    render(<ScopeSwitcher />);
    const trigger = screen.getByTestId("operator-scope-switcher-trigger");

    expect(trigger).toHaveTextContent("Sample workspace: Claims Intake");
    expect(trigger).not.toHaveTextContent(/^W:/);
    expect(trigger).not.toHaveTextContent("Primary project");
  });

  it("opens the sample-workspace info popover when switching is unavailable", async () => {
    render(<ScopeSwitcher />);
    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-switcher-panel")).toBeInTheDocument();
    });

    expect(screen.getByTestId("operator-scope-switcher-panel").parentElement).toBe(document.body);
    expect(screen.queryByText(/x-tenant-id/i)).not.toBeInTheDocument();
    expect(screen.getByText(BUYER_SCOPE_SAMPLE_WORKSPACE_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("operator-scope-sample-info-body")).toHaveTextContent(
      BUYER_SCOPE_SAMPLE_WORKSPACE_BODY,
    );
    expect(screen.queryByText(/directory is unavailable/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES })).toHaveAttribute(
      "href",
      "/help/scope",
    );
  });

  it("closes the panel on Continue, Escape, and outside click", async () => {
    render(<ScopeSwitcher />);
    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-switcher-panel")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: BUYER_SCOPE_SWITCHER_CONTINUE }));

    await waitFor(() => {
      expect(screen.queryByTestId("operator-scope-switcher-panel")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-switcher-panel")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTestId("operator-scope-switcher-panel")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-switcher-panel")).toBeInTheDocument();
    });

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(screen.queryByTestId("operator-scope-switcher-panel")).not.toBeInTheDocument();
    });
  });

  it("lists projects when multiple scope options are available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            workspaces: [
              {
                workspaceId: DEV_WORKSPACE,
                name: "Claims Intake Workspace",
                projects: [
                  { projectId: DEV_PROJECT, name: "Primary project" },
                  { projectId: "44444444-4444-4444-4444-444444444444", name: "Secondary project" },
                ],
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    render(<ScopeSwitcher />);
    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    expect(await screen.findByRole("button", { name: "Secondary project" })).toBeInTheDocument();
    expect(screen.queryByTestId("operator-scope-sample-info-body")).not.toBeInTheDocument();
  });
});

describe("ScopeSwitcher — buyer-polished shell", () => {
  beforeEach(() => {
    demoUiEnvMock.buyerPolishedShell = true;
    demoUiEnvMock.demoMode = true;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ workspaces: [] }), { status: 200 })),
    );
  });

  afterEach(() => {
    demoUiEnvMock.buyerPolishedShell = false;
    demoUiEnvMock.demoMode = false;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows a sample workspace indicator and opens the buyer-safe info popover", async () => {
    render(<ScopeSwitcher />);

    const trigger = screen.getByTestId("operator-scope-switcher-trigger");

    expect(trigger).toHaveTextContent("Sample workspace: Claims Intake");
    expect(trigger).toHaveAttribute("aria-label", "Active workspace: Sample workspace: Claims Intake");
    expect(screen.getByText("Sample workspace")).toBeInTheDocument();

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-switcher-panel")).toBeInTheDocument();
    });

    expect(screen.getByTestId("operator-scope-sample-info-body")).toHaveTextContent(
      BUYER_SCOPE_SAMPLE_WORKSPACE_BODY,
    );
    expect(screen.queryByText(/x-tenant-id/i)).not.toBeInTheDocument();
  });
});
