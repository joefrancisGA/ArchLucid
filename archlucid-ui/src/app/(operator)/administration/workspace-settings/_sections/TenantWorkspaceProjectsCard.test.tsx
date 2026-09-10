import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  PROJECT_DELETE_CONFIRM_ACTION_LABEL,
  PROJECT_DELETE_CONFIRM_TITLE,
  PROJECT_DELETE_DEFAULT_PROJECT_DISABLED_REASON,
  PROJECT_DELETE_EXECUTE_DISABLED_REASON,
  projectDeleteConfirmDescription,
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
    renderWithOperatorQuery(
      <TenantWorkspaceProjectsCard tenantDisplayName="Acme Architecture" scope={{ "x-tenant-id": "tenant-1" }} />,
    );

    expect(await screen.findByTestId("tenant-workspace-projects-list")).toBeInTheDocument();
    expect(screen.getByText("Core")).toBeInTheDocument();
    expect(screen.getByText("Edge")).toBeInTheDocument();
    expect(screen.getByText("Current scope")).toBeInTheDocument();

    const deleteButtons = screen.getAllByTestId("tenant-workspace-project-delete");
    expect(deleteButtons).toHaveLength(1);
    expect(deleteButtons[0]).not.toBeDisabled();
    expect(screen.getByTestId("tenant-project-delete-hint-proj-default")).toHaveTextContent(
      PROJECT_DELETE_DEFAULT_PROJECT_DISABLED_REASON,
    );
  });

  it("requires confirm before DELETE and calls the tenant project endpoint", async () => {
    renderWithOperatorQuery(
      <TenantWorkspaceProjectsCard tenantDisplayName="Acme Architecture" scope={{ "x-tenant-id": "tenant-1" }} />,
    );

    const deleteButtons = await screen.findAllByTestId("tenant-workspace-project-delete");
    expect(deleteButtons).toHaveLength(1);
    fireEvent.click(deleteButtons[0]!);

    expect(
      await screen.findByRole("heading", { name: PROJECT_DELETE_CONFIRM_TITLE }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(projectDeleteConfirmDescription("Edge", "Production", 30)),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: PROJECT_DELETE_CONFIRM_ACTION_LABEL }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/tenant/workspaces/ws-1/projects/proj-edge"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  it("warns when deleting the currently scoped project", async () => {
    vi.stubGlobal(
      "localStorage",
      {
        getItem: (key: string) =>
          key === "archlucid_operator_scope_v1"
            ? JSON.stringify({
                tenantId: "tenant-1",
                workspaceId: "ws-1",
                projectId: "proj-edge",
                workspaceLabel: "Production",
                projectLabel: "Edge",
              })
            : null,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
    );

    renderWithOperatorQuery(
      <TenantWorkspaceProjectsCard tenantDisplayName="Acme Architecture" scope={{ "x-tenant-id": "tenant-1" }} />,
    );

    const deleteButtons = await screen.findAllByTestId("tenant-workspace-project-delete");
    expect(deleteButtons).toHaveLength(1);
    fireEvent.click(deleteButtons[0]!);

    expect(await screen.findByTestId("project-delete-active-scope-warning")).toBeInTheDocument();
  });

  it("disables delete affordances below Execute authority", async () => {
    navAuth.callerAuthorityRank = 1;

    renderWithOperatorQuery(
      <TenantWorkspaceProjectsCard tenantDisplayName="Acme Architecture" scope={{ "x-tenant-id": "tenant-1" }} />,
    );

    await screen.findByTestId("tenant-workspace-projects-list");
    const deleteButtons = screen.queryAllByTestId("tenant-workspace-project-delete");
    expect(deleteButtons).toHaveLength(0);
    expect(screen.queryByTestId("tenant-workspace-projects-all-protected")).not.toBeInTheDocument();
    expect(screen.getByText(PROJECT_DELETE_EXECUTE_DISABLED_REASON)).toBeInTheDocument();
  });
});
