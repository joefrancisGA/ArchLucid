import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  PROJECTS_RECYCLE_BIN_RESTORE_CONFLICT_STATUS_LABEL,
  PROJECTS_RECYCLE_BIN_RESTORE_SUCCESS_STATUS_LABEL,
} from "@/lib/projects-recycle-bin-page-copy";
import { PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL } from "@/lib/projects-recycle-bin-restore-confirm-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/workspace-settings/recycle-bin",
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
    isAuthorityLoading: false,
  }),
}));

import { ProjectsRecycleBinPage } from "@/app/(operator)/administration/workspace-settings/recycle-bin/_sections/ProjectsRecycleBinPage";

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

describe("ProjectsRecycleBinPage feedback (TB-1182)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses operator sectionStack density (space-y-4)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(recycleBinPayload), { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    render(<ProjectsRecycleBinPage />);

    const page = await screen.findByTestId("projects-recycle-bin-page");

    expect(page.className).toContain("space-y-4");
    expect(page.className).not.toContain("space-y-6");
  });

  it("renders 409 restore as conflict feedback distinct from success", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("recycle-bin") && (init?.method ?? "GET") === "GET") {
        return new Response(JSON.stringify(recycleBinPayload), { status: 200 });
      }

      if (url.includes("/restore") && init?.method === "POST") {
        return new Response(null, { status: 409 });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ProjectsRecycleBinPage />);

    await waitFor(() => {
      expect(screen.getByTestId("projects-recycle-bin-row-proj-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Restore project Contoso Core" }));
    fireEvent.click(screen.getByRole("button", { name: PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL }));

    const feedback = await screen.findByTestId("projects-recycle-bin-restore-message");

    expect(feedback).toHaveAttribute("data-feedback-kind", "conflict");
    expect(feedback).toHaveAttribute("role", "alert");
    expect(feedback).toHaveTextContent(PROJECTS_RECYCLE_BIN_RESTORE_CONFLICT_STATUS_LABEL);
    expect(feedback).toHaveTextContent(/already uses this name/i);
    expect(feedback).not.toHaveTextContent(PROJECTS_RECYCLE_BIN_RESTORE_SUCCESS_STATUS_LABEL);
  });
});
