import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/tenant/recycle-bin",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
    isAuthorityLoading: false,
  }),
}));

import { ProjectsRecycleBinPage } from "@/app/(operator)/administration/tenant/recycle-bin/_sections/ProjectsRecycleBinPage";
import { PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL, PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE } from "@/lib/projects-recycle-bin-restore-confirm-copy";

const recycleBinPayload = {
  retentionDays: 30,
  workspaces: [
    {
      workspaceId: "ws-1",
      name: "Production",
      deletedProjects: [
        {
          projectId: "proj-1",
          name: "Contoso Core",
          deletedUtc: "2026-07-01T12:00:00.000Z",
          purgeAfterUtc: "2026-07-31T12:00:00.000Z",
        },
      ],
    },
  ],
};

describe("ProjectsRecycleBinPage restore confirm (TB-1290)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not POST restore until the confirm dialog is accepted", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("recycle-bin") && (init?.method ?? "GET") === "GET") {
        return new Response(JSON.stringify(recycleBinPayload), { status: 200 });
      }

      if (url.includes("/restore") && init?.method === "POST") {
        return new Response(null, { status: 204 });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ProjectsRecycleBinPage />);

    await waitFor(() => {
      expect(screen.getByTestId("projects-recycle-bin-row-proj-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Restore project Contoso Core" }));

    expect(
      screen.getByRole("heading", { name: PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/restore"))).toBe(true);
    });
  });
});
