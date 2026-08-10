import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvitationAcceptPageClient } from "@/app/(operator)/auth/invite/InvitationAcceptPageClient";
import {
  AUTH_INVITE_PUBLIC_EXIT_LABEL,
  AUTH_INVITE_REQUEST_ACCESS_LABEL,
  AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_LABEL,
  AUTH_INVITE_VALIDATION_FAILED_MESSAGE,
  resolveInvalidInvitationMessage,
} from "@/lib/auth/invitation-invalid-recovery-copy";

const validateInvitationToken = vi.fn();
const storeInvitationToken = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/lib/auth/invitation-validation-api", () => ({
  validateInvitationToken: (...args: unknown[]) => validateInvitationToken(...args),
}));

vi.mock("@/lib/auth/email-otp-session", () => ({
  storeInvitationToken: (...args: unknown[]) => storeInvitationToken(...args),
}));

import { useSearchParams } from "next/navigation";

function mockToken(token: string | null) {
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(token ? `token=${encodeURIComponent(token)}` : "") as ReturnType<
      typeof useSearchParams
    >,
  );
}

function expectRecoveryControls() {
  expect(screen.getByTestId("invitation-invalid-recovery")).toBeInTheDocument();
  expect(screen.getByTestId("invitation-recovery-public-exit")).toBeInTheDocument();
  expect(screen.getByTestId("invitation-recovery-help")).toBeInTheDocument();
}

describe("InvitationAcceptPageClient (TB-1474)", () => {
  beforeEach(() => {
    validateInvitationToken.mockReset();
    storeInvitationToken.mockReset();
  });

  it("exposes recovery controls when the invitation token is missing", async () => {
    mockToken(null);

    render(<InvitationAcceptPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("invitation-invalid-alert")).toHaveTextContent(
        resolveInvalidInvitationMessage("missing-token"),
      );
    });

    expectRecoveryControls();
    expect(screen.getByTestId("invitation-recovery-sign-in")).toHaveAttribute("href", "/auth/signin");
    expect(screen.getByTestId("invitation-recovery-request-access")).toHaveAttribute("href", "/signup");
    expect(screen.getByTestId("invitation-recovery-public-exit")).toHaveTextContent(
      AUTH_INVITE_PUBLIC_EXIT_LABEL,
    );
  });

  it.each([
    ["Expired", "expired"],
    ["Revoked", "revoked"],
    ["Accepted", "accepted"],
    ["Invalid", "invalid"],
  ] as const)("exposes recovery controls for %s invitations", async (status, context) => {
    mockToken("invite-token");
    validateInvitationToken.mockResolvedValue({
      status,
      allowEmailCode: true,
      requireEnterpriseSso: false,
    });

    render(<InvitationAcceptPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("invitation-invalid-alert")).toHaveTextContent(
        resolveInvalidInvitationMessage(context),
      );
    });

    expectRecoveryControls();
    expect(screen.getByTestId("invitation-recovery-sign-in")).toHaveTextContent(
      AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_LABEL,
    );
    expect(screen.getByTestId("invitation-recovery-request-access")).toHaveTextContent(
      AUTH_INVITE_REQUEST_ACCESS_LABEL,
    );
  });

  it("prioritizes request access when the invitation is expired", async () => {
    mockToken("invite-token");
    validateInvitationToken.mockResolvedValue({
      status: "Expired",
      allowEmailCode: true,
      requireEnterpriseSso: false,
    });

    render(<InvitationAcceptPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("invitation-recovery-request-access")).toHaveAttribute("href", "/signup");
    });

    const requestAccessButtons = screen.getAllByRole("link", { name: AUTH_INVITE_REQUEST_ACCESS_LABEL });
    const primaryRequestAccess = requestAccessButtons.find(
      (link) => link.getAttribute("data-testid") === "invitation-recovery-request-access",
    );

    expect(primaryRequestAccess).toBeDefined();
  });

  it("exposes retry and recovery controls when validation fails", async () => {
    mockToken("invite-token");
    validateInvitationToken.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({
      status: "Valid",
      allowEmailCode: true,
      requireEnterpriseSso: false,
      maskedInvitedEmail: "o***@example.com",
    });

    render(<InvitationAcceptPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("invitation-invalid-alert")).toHaveTextContent(
        AUTH_INVITE_VALIDATION_FAILED_MESSAGE,
      );
    });

    expectRecoveryControls();
    expect(screen.getByTestId("invitation-recovery-retry")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("invitation-recovery-retry"));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Continue to sign in" })).toBeInTheDocument();
    });
  });
});
