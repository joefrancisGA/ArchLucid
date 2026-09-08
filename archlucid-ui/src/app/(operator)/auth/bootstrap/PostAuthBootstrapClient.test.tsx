import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchPostAuthBootstrapStatus = vi.fn();
const acceptPostAuthInvitation = vi.fn();
const selectPostAuthWorkspace = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("returnUrl=%2Farchitecture%2Freviews"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/auth/bootstrap",
}));

vi.mock("@/lib/auth/post-auth-bootstrap-api", () => ({
  fetchPostAuthBootstrapStatus: (...args: unknown[]) => fetchPostAuthBootstrapStatus(...args),
  createPostAuthWorkspace: vi.fn(),
  acceptPostAuthInvitation: (...args: unknown[]) => acceptPostAuthInvitation(...args),
  selectPostAuthWorkspace: (...args: unknown[]) => selectPostAuthWorkspace(...args),
  initiatePostAuthAccessRequest: vi.fn(),
}));

import { PostAuthBootstrapClient } from "@/app/(operator)/auth/bootstrap/PostAuthBootstrapClient";

describe("PostAuthBootstrapClient (TB-1465)", () => {
  beforeEach(() => {
    fetchPostAuthBootstrapStatus.mockReset();
    fetchPostAuthBootstrapStatus.mockImplementation(
      () =>
        new Promise(() => {
          /* keep loading */
        }),
    );
  });

  it("renders branded auth-flow chrome while bootstrap status loads", async () => {
    render(<PostAuthBootstrapClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-flow-shell")).toBeInTheDocument();
    });

    expect(screen.getByTestId("post-auth-bootstrap-loading")).toBeInTheDocument();
    expect(screen.queryByText(/Preparing your ArchLucid workspace/i)).not.toBeInTheDocument();
  });
});

describe("PostAuthBootstrapClient (TB-1468)", () => {
  beforeEach(() => {
    fetchPostAuthBootstrapStatus.mockReset();
  });

  it("uses a primary continue action when one workspace is available", async () => {
    fetchPostAuthBootstrapStatus.mockResolvedValue({
      destination: "SelectWorkspace",
      pendingInvitations: [],
      workspaces: [{ tenantId: "t1", workspaceId: "w1", workspaceName: "Northwind" }],
      canCreateWorkspace: false,
    });

    render(<PostAuthBootstrapClient />);

    await waitFor(() => {
      expect(screen.getByTestId("bootstrap-select-workspace-step")).toBeInTheDocument();
    });

    const workspaceButton = screen.getByTestId("bootstrap-select-workspace-w1");

    expect(workspaceButton).toHaveAttribute("data-workspace-primary", "true");
    expect(workspaceButton).toHaveTextContent("Continue to Northwind");
  });

  it("sanitizes raw denial reasons on the no-access step", async () => {
    fetchPostAuthBootstrapStatus.mockResolvedValue({
      destination: "NoAccess",
      pendingInvitations: [],
      workspaces: [],
      canCreateWorkspace: false,
      denialReason: "System.NullReferenceException: Object reference not set",
    });

    render(<PostAuthBootstrapClient />);

    await waitFor(() => {
      expect(screen.getByTestId("bootstrap-no-access-step")).toBeInTheDocument();
    });

    expect(screen.getByText(/no workspace is available for this account/i)).toBeInTheDocument();
    expect(screen.queryByText(/NullReferenceException/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Request access/i })).toBeInTheDocument();
  });
});

describe("PostAuthBootstrapClient (TB-1469)", () => {
  beforeEach(() => {
    fetchPostAuthBootstrapStatus.mockReset();
  });

  it("exposes safe secondary exits when bootstrap status cannot be loaded", async () => {
    fetchPostAuthBootstrapStatus.mockRejectedValue(new Error("network"));

    render(<PostAuthBootstrapClient />);

    await waitFor(() => {
      expect(screen.getByTestId("bootstrap-load-error-step")).toBeInTheDocument();
    });

    expect(screen.getByTestId("bootstrap-secondary-exit")).toBeInTheDocument();
    expect(screen.getByTestId("bootstrap-sign-in-again")).toBeInTheDocument();
    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("bootstrap-public-exit")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("bootstrap-public-exit")).not.toHaveAttribute("href", "/welcome");
  });

  it("exposes safe secondary exits on the no-access step", async () => {
    fetchPostAuthBootstrapStatus.mockResolvedValue({
      destination: "NoAccess",
      pendingInvitations: [],
      workspaces: [],
      canCreateWorkspace: false,
      denialReason: null,
    });

    render(<PostAuthBootstrapClient />);

    await waitFor(() => {
      expect(screen.getByTestId("bootstrap-no-access-step")).toBeInTheDocument();
    });

    expect(screen.getByTestId("bootstrap-secondary-exit")).toBeInTheDocument();
    expect(screen.getByTestId("bootstrap-use-different-account")).toBeInTheDocument();
    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("bootstrap-public-exit")).toHaveAttribute("href", "/");
  });
});

describe("PostAuthBootstrapClient (TB-1469 mid-flow recovery)", () => {
  beforeEach(() => {
    fetchPostAuthBootstrapStatus.mockReset();
    acceptPostAuthInvitation.mockReset();
    selectPostAuthWorkspace.mockReset();
  });

  it("exposes Report Problem and secondary exits when invitation accept fails", async () => {
    fetchPostAuthBootstrapStatus.mockResolvedValue({
      destination: "AcceptInvitation",
      pendingInvitations: [
        {
          invitationId: "inv-1",
          label: "Northwind",
          maskedInvitedEmail: "a***@example.com",
          requiresEmailMismatchConfirmation: false,
        },
      ],
      workspaces: [],
      canCreateWorkspace: false,
    });
    acceptPostAuthInvitation.mockResolvedValue(null);

    render(<PostAuthBootstrapClient />);

    await waitFor(() => {
      expect(screen.getByTestId("bootstrap-accept-invitation-inv-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("bootstrap-accept-invitation-inv-1"));

    await waitFor(() => {
      expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    });

    expect(screen.getByTestId("bootstrap-secondary-exit")).toBeInTheDocument();
    expect(screen.getByTestId("bootstrap-sign-in-again")).toBeInTheDocument();
  });

  it("exposes Report Problem and secondary exits when workspace select fails", async () => {
    fetchPostAuthBootstrapStatus.mockResolvedValue({
      destination: "SelectWorkspace",
      pendingInvitations: [],
      workspaces: [{ tenantId: "t1", workspaceId: "w1", workspaceName: "Northwind" }],
      canCreateWorkspace: false,
    });
    selectPostAuthWorkspace.mockResolvedValue(null);

    render(<PostAuthBootstrapClient />);

    await waitFor(() => {
      expect(screen.getByTestId("bootstrap-select-workspace-w1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("bootstrap-select-workspace-w1"));

    await waitFor(() => {
      expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    });

    expect(screen.getByTestId("bootstrap-secondary-exit")).toBeInTheDocument();
    expect(screen.getByTestId("bootstrap-use-different-account")).toBeInTheDocument();
  });
});
