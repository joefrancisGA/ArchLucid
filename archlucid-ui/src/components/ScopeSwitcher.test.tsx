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

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

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

import * as operatorScopeStorage from "@/lib/operator/operator-scope-storage";

import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_BODY,
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
  BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT,
  BUYER_SCOPE_SWITCHER_CLOSE,
  BUYER_SCOPE_SWITCHER_CONNECTED_INTRO,
  BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES,
} from "@/lib/buyer/buyer-polish-copy";
import { formatScopeSwitcherSampleFullTitle, formatScopeSwitcherTriggerAccessibleLabel } from "@/lib/scope-switcher-display";

import { ScopeSwitcher } from "@/components/ScopeSwitcher";

const sampleAccessibleLabel = formatScopeSwitcherTriggerAccessibleLabel({
  workspaceLabel: "Claims Intake Workspace",
  projectLabel: "Primary project",
  isSampleWorkspaceSession: true,
  includeProject: false,
});

describe("ScopeSwitcher — operator shell", () => {
  beforeEach(() => {
    demoUiEnvMock.buyerPolishedShell = false;
    demoUiEnvMock.demoMode = false;
    vi.mocked(operatorScopeStorage.getEffectiveBrowserProxyScopeHeaders).mockReturnValue({
      "x-tenant-id": DEV_TENANT,
      "x-workspace-id": DEV_WORKSPACE,
      "x-project-id": DEV_PROJECT,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ workspaces: [] }), { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows a compact sample workspace label without the Sample workspace prefix", () => {
    render(<ScopeSwitcher density="compact" />);
    const trigger = screen.getByTestId("operator-scope-switcher-trigger");

    expect(trigger).toHaveTextContent(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
    expect(trigger).not.toHaveTextContent("Sample workspace:");
    expect(trigger).not.toHaveTextContent(/^W:/);
    expect(trigger).not.toHaveTextContent("Primary project");
    expect(trigger).toHaveAttribute("aria-label", sampleAccessibleLabel);
    expect(trigger).toHaveAttribute("title", sampleAccessibleLabel);
    expect(trigger.className).toMatch(/max-w-/);
  });

  it("keeps a dropdown caret visible for the sample workspace trigger", () => {
    render(<ScopeSwitcher density="compact" />);

    expect(screen.getByTestId("operator-scope-switcher-trigger").querySelector("svg")).not.toBeNull();
  });

  it("opens the sample-workspace info popover when switching is unavailable", async () => {
    render(<ScopeSwitcher />);
    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-switcher-panel")).toBeInTheDocument();
    });

    expect(screen.getByTestId("operator-scope-switcher-panel").parentElement).toBe(document.body);
    expect(screen.queryByText(/x-tenant-id/i)).not.toBeInTheDocument();
    expect(screen.getByText(formatScopeSwitcherSampleFullTitle())).toBeInTheDocument();
    expect(screen.getByText(BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT)).toBeInTheDocument();
    expect(screen.getByText("Sample")).toBeInTheDocument();
    expect(screen.getByTestId("operator-scope-sample-info-body")).toHaveTextContent(
      BUYER_SCOPE_SAMPLE_WORKSPACE_BODY,
    );
    expect(screen.queryByText(/directory is unavailable/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-scope-switcher-tenant-context")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES })).toHaveAttribute(
      "href",
      "/help/scope",
    );
    const closeButton = screen.getByRole("button", { name: BUYER_SCOPE_SWITCHER_CLOSE });
    expect(closeButton.tagName).toBe("BUTTON");
    expect(closeButton).toHaveAttribute("type", "button");
  });

  it("renders Close on the workspace list error panel for a connected scope session", async () => {
    vi.mocked(operatorScopeStorage.getEffectiveBrowserProxyScopeHeaders).mockReturnValue({
      "x-tenant-id": DEV_TENANT,
      "x-workspace-id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "x-project-id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );

    render(<ScopeSwitcher />);
    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-list-note")).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: BUYER_SCOPE_SWITCHER_CLOSE });
    expect(closeButton).toHaveAttribute("type", "button");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("operator-scope-switcher-panel")).not.toBeInTheDocument();
    });
  });

  it("closes the panel on Close, Escape, and outside click", async () => {
    render(<ScopeSwitcher />);
    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-switcher-panel")).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: BUYER_SCOPE_SWITCHER_CLOSE });
    expect(closeButton).toHaveAttribute("type", "button");
    expect(screen.queryByRole("button", { name: /got it/i })).toBeNull();
    fireEvent.click(closeButton);

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
    expect(screen.getByRole("button", { name: "Primary project" })).toHaveAttribute("aria-current", "true");
    expect(screen.queryByText(BUYER_SCOPE_SWITCHER_CONNECTED_INTRO)).not.toBeInTheDocument();
    expect(screen.queryByTestId("operator-scope-sample-info-body")).not.toBeInTheDocument();
  });

  it("lists single-project workspaces by workspace name and omits the data-handling link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            workspaces: [
              {
                workspaceId: DEV_WORKSPACE,
                name: "Development default workspace",
                projects: [{ projectId: DEV_PROJECT, name: "default" }],
              },
              {
                workspaceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                name: "Product Tour — Architecture Review",
                projects: [{ projectId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "product-tour-architecture-context" }],
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    render(<ScopeSwitcher />);
    fireEvent.click(screen.getByTestId("operator-scope-switcher-trigger"));

    const activeOption = await screen.findByRole("button", { name: "Development default workspace" });
    expect(activeOption).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Product Tour — Architecture Review" })).toBeInTheDocument();
    expect(screen.queryByText("default")).not.toBeInTheDocument();
    expect(screen.queryByText("product-tour-architecture-context")).not.toBeInTheDocument();
    expect(screen.queryByText(BUYER_SCOPE_SWITCHER_CONNECTED_INTRO)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /how we handle your data/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-scope-switcher-tenant-context")).toBeInTheDocument();
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

  it("shows a compact sample label with full accessible text and opens the buyer-safe info popover", async () => {
    render(<ScopeSwitcher density="compact" />);

    const trigger = screen.getByTestId("operator-scope-switcher-trigger");

    expect(trigger).toHaveTextContent(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
    expect(trigger).not.toHaveTextContent("Sample workspace:");
    expect(trigger).toHaveAttribute("aria-label", sampleAccessibleLabel);
    expect(trigger).toHaveAttribute("title", sampleAccessibleLabel);
    expect(trigger.querySelector("svg")).not.toBeNull();

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId("operator-scope-switcher-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(formatScopeSwitcherSampleFullTitle())).toBeInTheDocument();
    expect(screen.getByText(BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT)).toBeInTheDocument();
    expect(screen.getByTestId("operator-scope-sample-info-body")).toHaveTextContent(
      BUYER_SCOPE_SAMPLE_WORKSPACE_BODY,
    );
    expect(screen.queryByText(/x-tenant-id/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /how we handle your data/i })).not.toBeInTheDocument();
  });
});
