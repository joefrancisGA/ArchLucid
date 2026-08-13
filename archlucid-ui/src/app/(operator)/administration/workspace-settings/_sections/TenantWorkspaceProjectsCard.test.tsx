import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  PROJECT_DELETE_CONFIRM_ACTION_LABEL,
  PROJECT_DELETE_CONFIRM_TITLE,
  PROJECT_DELETE_DEFAULT_PROJECT_DISABLED_REASON,
  PROJECT_DELETE_EXECUTE_DISABLED_REASON,
} from "@/lib/projects-delete-confirm-copy";

const navAuth = vi.hoisted(() => ({
  callerAuthorityRank: 2,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: navAuth.callerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

import { TenantWorkspaceProjectsCard } from "@/app/(operator)/administration/workspace-settings/_sections/TenantWorkspaceProjectsCard";

const WORKSPACES_PAYLOAD = {
  retentionDays: 30,
  workspaces: [
    {
      workspaceId: "ws-1",
      name: "Production",
      defaultProjectId: "proj-default",
      projects: [
        { projectId: "proj-default", name: "Core" },
        { projectId: "proj-edge", name: "Edge" },
      ],
    },
  ],
};

describe("TenantWorkspaceProjectsCard (TB-1179)", () => {
  beforeEach(() => {
    navAuth.callerAuthorityRank = 2;

    vi.stubGlobal(
      "localStorage",
      {
        getItem: (key: string) =>
          key === "archlucid_operator_scope_v1"
            ? JSON.stringify({
                tenantId: "tenant-1",
                workspaceId: "ws-1",
                projectId: "proj-default",
                workspaceLabel: "Production",
                projectLabel: "Core",
              })
            : null,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url.includes("/v1/tenant/workspaces") && method === "GET") {
          return new Response(JSON.stringify(WORKSPACES_PAYLOAD), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.includes("/projects/proj-edge") && method === "DELETE") {
          return new Response(null, { status: 204 });
        }

        return new Response("{}", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("lists projects and disables delete for the workspace default project", async () => {
    renderWithOperatorQuery(<TenantWorkspaceProjectsCard />);

    expect(await screen.findByTestId("tenant-workspace-projects-list")).toBeInTheDocument();
    expect(screen.getByText("Core")).toBeInTheDocument();
    expect(screen.getByText("Edge")).toBeInTheDocument();

    const deleteButtons = screen.getAllByTestId("tenant-workspace-project-delete");
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[0]).toHaveAttribute("aria-describedby", "tenant-project-delete-hint-proj-default");
    expect(screen.getByText(PROJECT_DELETE_DEFAULT_PROJECT_DISABLED_REASON)).toBeInTheDocument();
    expect(deleteButtons[1]).not.toBeDisabled();
    expect(deleteButtons[1]).not.toHaveAttribute("aria-describedby");
  });

  it("requires confirm before DELETE and calls the tenant project endpoint", async () => {
    renderWithOperatorQuery(<TenantWorkspaceProjectsCard />);

    const deleteButtons = await screen.findAllByTestId("tenant-workspace-project-delete");
    fireEvent.click(deleteButtons[1]!);

    expect(
      await screen.findByRole("heading", { name: PROJECT_DELETE_CONFIRM_TITLE }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: PROJECT_DELETE_CONFIRM_ACTION_LABEL }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/tenant/workspaces/ws-1/projects/proj-edge"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  it("disables delete affordances below Execute authority", async () => {
    navAuth.callerAuthorityRank = 1;

    renderWithOperatorQuery(<TenantWorkspaceProjectsCard />);

    const deleteButtons = await screen.findAllByTestId("tenant-workspace-project-delete");
    for (const button of deleteButtons) {
      expect(button).toBeDisabled();
      expect(button.getAttribute("aria-describedby")).toMatch(/^tenant-project-delete-hint-/);
    }

    expect(screen.getAllByText(PROJECT_DELETE_EXECUTE_DISABLED_REASON).length).toBeGreaterThanOrEqual(
      deleteButtons.length,
    );
  });
});
