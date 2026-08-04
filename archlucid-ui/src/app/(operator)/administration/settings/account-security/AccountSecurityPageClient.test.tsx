import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountSecurityPageClient } from "./AccountSecurityPageClient";
import {
  confirmSignInMethodLinkProposal,
  fetchSignInMethods,
  requestEmailLinkChallenge,
  verifyEmailLinkChallenge,
} from "@/lib/sign-in-methods-api";

vi.mock("@/lib/sign-in-methods-api", () => ({
  fetchSignInMethods: vi.fn(),
  requestEmailLinkChallenge: vi.fn(),
  verifyEmailLinkChallenge: vi.fn(),
  confirmSignInMethodLinkProposal: vi.fn(),
  cancelSignInMethodLinkProposal: vi.fn(),
  removeSignInMethod: vi.fn(),
}));

const pendingProposal = {
  proposalId: "proposal-1",
  providerType: "EmailOtp",
  providerLabel: "Email code",
  maskedIdentifier: "y***@example.com",
  requiresExplicitConfirmation: true,
  confirmationMessage: "Link this email as a sign-in method?",
  expiresUtc: "2026-08-01T00:00:00.000Z",
};

describe("AccountSecurityPageClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("disables confirm while confirm link is in flight", async () => {
    vi.mocked(fetchSignInMethods).mockResolvedValue([]);
    vi.mocked(requestEmailLinkChallenge).mockResolvedValue({ challengeId: "challenge-1" });
    vi.mocked(verifyEmailLinkChallenge).mockResolvedValue(pendingProposal);

    let resolveConfirm: (() => void) | undefined;
    const confirmPromise = new Promise<void>((resolve) => {
      resolveConfirm = resolve;
    });
    vi.mocked(confirmSignInMethodLinkProposal).mockReturnValue(confirmPromise);

    render(<AccountSecurityPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("add-sign-in-method-card")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Email for one-time code"), {
      target: { value: "you@example.com" },
    });
    fireEvent.click(screen.getByTestId("account-security-send-code"));

    await waitFor(() => {
      expect(screen.getByLabelText("Verification code")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByTestId("account-security-verify-code"));

    await waitFor(() => {
      expect(screen.getByTestId("account-security-confirm-link")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("account-security-confirm-link"));

    await waitFor(() => {
      expect(screen.getByTestId("account-security-confirm-link")).toBeDisabled();
      expect(screen.getByTestId("account-security-cancel-link")).toBeDisabled();
    });

    expect(confirmSignInMethodLinkProposal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("account-security-confirm-link"));
    expect(confirmSignInMethodLinkProposal).toHaveBeenCalledTimes(1);

    resolveConfirm?.();
    await waitFor(() => {
      expect(confirmSignInMethodLinkProposal).toHaveBeenCalledTimes(1);
    });
  });

  it("disables send code while challenge request is in flight", async () => {
    vi.mocked(fetchSignInMethods).mockResolvedValue([]);

    let resolveChallenge: (() => void) | undefined;
    const challengePromise = new Promise<{ challengeId: string }>((resolve) => {
      resolveChallenge = () => resolve({ challengeId: "challenge-1" });
    });
    vi.mocked(requestEmailLinkChallenge).mockReturnValue(challengePromise);

    render(<AccountSecurityPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("add-sign-in-method-card")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Email for one-time code"), {
      target: { value: "you@example.com" },
    });
    fireEvent.click(screen.getByTestId("account-security-send-code"));

    await waitFor(() => {
      expect(screen.getByTestId("account-security-send-code")).toBeDisabled();
    });

    expect(requestEmailLinkChallenge).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("account-security-send-code"));
    expect(requestEmailLinkChallenge).toHaveBeenCalledTimes(1);

    resolveChallenge?.();
    await waitFor(() => {
      expect(screen.getByTestId("account-security-send-code")).not.toBeDisabled();
    });
  });
});
