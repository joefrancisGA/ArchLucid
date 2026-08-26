import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_BOOTSTRAP_CLAIM_DISCIPLINE,
  AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE,
} from "@/lib/auth-bootstrap-evidence-copy";
import {
  AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID,
  AUTH_BOOTSTRAP_SKIP_LINK_LABEL,
} from "@/lib/auth/auth-bootstrap-page-copy";

const fetchPostAuthBootstrapStatus = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth/post-auth-bootstrap-api", () => ({
  fetchPostAuthBootstrapStatus: (...args: unknown[]) => fetchPostAuthBootstrapStatus(...args),
  createPostAuthWorkspace: vi.fn(),
  acceptPostAuthInvitation: vi.fn(),
  selectPostAuthWorkspace: vi.fn(),
  initiatePostAuthAccessRequest: vi.fn(),
}));

import { PostAuthBootstrapClient } from "@/app/(operator)/auth/bootstrap/PostAuthBootstrapClient";

describe("PostAuthBootstrapClient buyer-polished shell", () => {
  beforeEach(() => {
    fetchPostAuthBootstrapStatus.mockReset();
    fetchPostAuthBootstrapStatus.mockResolvedValue({
      destination: "SelectWorkspace",
      pendingInvitations: [],
      workspaces: [{ tenantId: "t1", workspaceId: "w1", workspaceName: "Northwind" }],
      canCreateWorkspace: false,
    });
  });

  it("renders skip link, breadcrumb, workspace selection, then orientation below the panel", async () => {
    render(<PostAuthBootstrapClient />);

    await waitFor(() => {
      expect(screen.getByTestId("bootstrap-select-workspace-step")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: AUTH_BOOTSTRAP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("post-auth-bootstrap-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("post-auth-bootstrap-claim-discipline").textContent).toContain(
      AUTH_BOOTSTRAP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const orientation = screen.getByTestId("post-auth-bootstrap-orientation-bottom");
    const workspaceStep = screen.getByTestId("bootstrap-select-workspace-step");

    expect(orientation.compareDocumentPosition(workspaceStep) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
