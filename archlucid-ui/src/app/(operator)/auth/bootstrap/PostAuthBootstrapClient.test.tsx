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
