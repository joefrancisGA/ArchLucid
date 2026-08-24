import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchPostAuthBootstrapStatus = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("returnUrl=%2Farchitecture%2Freviews"),
}));

vi.mock("@/lib/auth/post-auth-bootstrap-api", () => ({
  fetchPostAuthBootstrapStatus: (...args: unknown[]) => fetchPostAuthBootstrapStatus(...args),
  createPostAuthWorkspace: vi.fn(),
  acceptPostAuthInvitation: vi.fn(),
  selectPostAuthWorkspace: vi.fn(),
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
    expect(screen.getByTestId("bootstrap-public-exit")).toHaveAttribute("href", "/");
  });
});
