import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_BOOTSTRAP_CLAIM_DISCIPLINE,
  AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE,
  AUTH_BOOTSTRAP_SOURCES,
} from "@/lib/auth-bootstrap-evidence-copy";
import {
  AUTH_BOOTSTRAP_FIRST_VIEWPORT_ID,
  AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID,
  AUTH_BOOTSTRAP_SKIP_LINK_LABEL,
  AUTH_BOOTSTRAP_SKIP_TARGET_ID,
} from "@/lib/auth/auth-bootstrap-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

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

  it("renders skip link, orientation above workspace step, and Sources below the panel", async () => {
    render(<PostAuthBootstrapClient />);

    await waitFor(() => {
      expect(screen.getByTestId("bootstrap-select-workspace-step")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: AUTH_BOOTSTRAP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_BOOTSTRAP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("post-auth-bootstrap-primary-content")).toHaveAttribute(
      "id",
      AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("post-auth-bootstrap-breadcrumb")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("post-auth-bootstrap-primary-content");
    const firstViewport = screen.getByTestId(AUTH_BOOTSTRAP_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("post-auth-bootstrap-orientation-top");
    const workspaceStep = screen.getByTestId("bootstrap-select-workspace-step");
    const orientationBottom = screen.getByTestId("post-auth-bootstrap-orientation-bottom");
    const sourcesSection = screen.getByTestId("post-auth-bootstrap-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(workspaceStep);
    expect(orientationTop.compareDocumentPosition(workspaceStep) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      orientationBottom.compareDocumentPosition(workspaceStep) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();

    expect(within(orientationTop).getByTestId("post-auth-bootstrap-claim-discipline").textContent).toContain(
      AUTH_BOOTSTRAP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(AUTH_BOOTSTRAP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
