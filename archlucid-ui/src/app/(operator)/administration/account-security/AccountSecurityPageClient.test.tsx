import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountSecurityPageClient } from "./AccountSecurityPageClient";
import {
  confirmSignInMethodLinkProposal,
  fetchSignInMethods,
  removeSignInMethod,
  requestEmailLinkChallenge,
  verifyEmailLinkChallenge,
} from "@/lib/sign-in-methods-api";
import { SignInMethodsApiError } from "@/lib/sign-in-methods-problem";
import {
  ACCOUNT_SECURITY_AUTH_GATE_MESSAGE,
  ACCOUNT_SECURITY_DEMO_GATE_MESSAGE,
  ACCOUNT_SECURITY_EMPTY_METHODS_HELP_CTA,
  ACCOUNT_SECURITY_EMPTY_METHODS_MESSAGE,
  ACCOUNT_SECURITY_INACTIVE_METHOD_HELPER,
  ACCOUNT_SECURITY_RECENT_AUTH_LIST_UNAVAILABLE,
} from "@/lib/account-security-page-copy";
import { SETTINGS_ACCOUNT_SECURITY_PATH } from "@/lib/settings-admin-route-paths";
import {
  SIGN_IN_METHOD_LAST_REMAINING_BLOCKED_REASON,
} from "@/lib/sign-in-method-remove-blocked-copy";

const frictionlessMock = vi.hoisted(() => ({
  enabled: false,
}));

vi.mock("@/lib/frictionless-trial-session", () => ({
  readFrictionlessTrialSessionEnabled: () => frictionlessMock.enabled,
}));

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
  expiresUtc: "2099-08-01T00:00:00.000Z",
};

const activeMethod = {
  identityId: "id-1",
  providerType: "EmailOtp",
  providerLabel: "Email code",
  maskedIdentifier: "y***@example.com",
  addedUtc: "2026-07-01T00:00:00.000Z",
  lastUsedUtc: null,
  isActive: true,
  canRemove: true,
};

describe("AccountSecurityPageClient", () => {
  beforeEach(() => {
    frictionlessMock.enabled = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows auth prerequisite empty with return-path sign-in and no top gate callout", async () => {
    vi.mocked(fetchSignInMethods).mockRejectedValue(
      new SignInMethodsApiError({
        kind: "unauthorized-platform-user",
        message: ACCOUNT_SECURITY_AUTH_GATE_MESSAGE,
      }),
    );

    render(<AccountSecurityPageClient />);

    const emptyState = await screen.findByTestId("account-security-auth-required-empty-state");

    expect(emptyState.textContent).not.toContain("{");
    expect(emptyState.textContent).not.toContain("correlationId");
    expect(emptyState).toHaveTextContent(ACCOUNT_SECURITY_AUTH_GATE_MESSAGE);
    expect(screen.queryByText(ACCOUNT_SECURITY_EMPTY_METHODS_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("add-sign-in-method-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-security-auth-gate")).not.toBeInTheDocument();

    const signInLink = screen.getByRole("link", { name: "Sign in" });

    expect(signInLink).toHaveAttribute(
      "href",
      expect.stringContaining(`returnUrl=${encodeURIComponent(SETTINGS_ACCOUNT_SECURITY_PATH)}`),
    );
    expect(screen.queryByRole("link", { name: "Start an evaluation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /signup/i })).not.toBeInTheDocument();
  });

  it("shows demo-scoped prerequisite empty without a not-signed-in assertion", async () => {
    frictionlessMock.enabled = true;

    render(<AccountSecurityPageClient />);

    const emptyState = await screen.findByTestId("account-security-demo-blocked-empty-state");

    expect(emptyState).toHaveTextContent(ACCOUNT_SECURITY_DEMO_GATE_MESSAGE);
    expect(emptyState.textContent?.toLowerCase()).not.toContain("not signed in");
    expect(screen.queryByTestId("account-security-auth-gate")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(fetchSignInMethods).not.toHaveBeenCalled();
    expect(screen.queryByTestId("account-security-send-code")).not.toBeInTheDocument();
  });

  it("shows recent-auth gate callout with return-path sign-in again", async () => {
    vi.mocked(fetchSignInMethods).mockRejectedValue(
      new SignInMethodsApiError({
        kind: "recent-auth-required",
        message: "Recent authentication is required. Sign in again and retry.",
      }),
    );

    render(<AccountSecurityPageClient />);

    const gate = await screen.findByTestId("account-security-auth-gate");

    expect(gate).toHaveTextContent(/Recent authentication/i);
    expect(screen.queryByTestId("account-security-auth-required-empty-state")).not.toBeInTheDocument();

    const signInAgainLink = screen.getByRole("link", { name: "Sign in again" });

    expect(signInAgainLink).toHaveAttribute(
      "href",
      expect.stringContaining(`returnUrl=${encodeURIComponent(SETTINGS_ACCOUNT_SECURITY_PATH)}`),
    );

    expect(screen.getByTestId("sign-in-methods-recent-auth-unavailable")).toHaveTextContent(
      ACCOUNT_SECURITY_RECENT_AUTH_LIST_UNAVAILABLE,
    );
  });

  it("renders personal-settings breadcrumb trail", async () => {
    vi.mocked(fetchSignInMethods).mockResolvedValue([]);

    render(<AccountSecurityPageClient />);

    const breadcrumb = await screen.findByTestId("account-security-page-breadcrumb");

    expect(breadcrumb).toHaveTextContent("Your account settings");
    expect(breadcrumb).toHaveTextContent("Sign-in methods");
  });

  it("shows empty copy with authentication help CTA only after a successful empty list load (TB-1884)", async () => {
    vi.mocked(fetchSignInMethods).mockResolvedValue([]);

    render(<AccountSecurityPageClient />);

    const emptyState = await screen.findByTestId("account-security-empty-methods");

    expect(emptyState).toHaveTextContent(ACCOUNT_SECURITY_EMPTY_METHODS_MESSAGE);
    expect(screen.getByRole("link", { name: ACCOUNT_SECURITY_EMPTY_METHODS_HELP_CTA })).toHaveAttribute(
      "href",
      "/help/authentication-sign-in",
    );
    expect(screen.queryByTestId("account-security-auth-gate")).not.toBeInTheDocument();
  });

  it("disables send until email is valid and never toasts client validation", async () => {
    vi.mocked(fetchSignInMethods).mockResolvedValue([]);

    render(<AccountSecurityPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("account-security-send-code")).toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText("Email for one-time code"), {
      target: { value: "not-an-email" },
    });
    fireEvent.blur(screen.getByLabelText("Email for one-time code"));

    expect(screen.getByTestId("account-security-send-code")).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);

    fireEvent.change(screen.getByLabelText("Email for one-time code"), {
      target: { value: "you@example.com" },
    });

    expect(screen.getByTestId("account-security-send-code")).not.toBeDisabled();
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

  it("shows blocked-remove reason without a Remove button", async () => {
    vi.mocked(fetchSignInMethods).mockResolvedValue([
      {
        ...activeMethod,
        canRemove: false,
      },
    ]);

    render(<AccountSecurityPageClient />);

    expect(await screen.findByText(SIGN_IN_METHOD_LAST_REMAINING_BLOCKED_REASON)).toBeInTheDocument();
    expect(screen.queryByTestId("sign-in-method-remove-id-1")).not.toBeInTheDocument();
  });

  it("explains inactive sign-in methods with recovery copy (TB-1884)", async () => {
    vi.mocked(fetchSignInMethods).mockResolvedValue([
      {
        ...activeMethod,
        isActive: false,
      },
    ]);

    render(<AccountSecurityPageClient />);

    expect(await screen.findByTestId("sign-in-method-inactive-helper-id-1")).toHaveTextContent(
      ACCOUNT_SECURITY_INACTIVE_METHOD_HELPER,
    );
  });

  it("opens AlertDialog for remove and never calls window.confirm", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(fetchSignInMethods).mockResolvedValue([activeMethod]);
    vi.mocked(removeSignInMethod).mockResolvedValue(undefined);

    render(<AccountSecurityPageClient />);

    fireEvent.click(await screen.findByTestId("sign-in-method-remove-id-1"));

    expect(
      await screen.findByRole("heading", { name: "Remove Email code (y***@example.com)?" }),
    ).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(removeSignInMethod).toHaveBeenCalledWith("id-1");
    });

    expect(await screen.findByTestId("account-security-list-feedback")).toHaveTextContent(/removed/i);
    confirmSpy.mockRestore();
  });

  it("does not use pastel amber fills on the confirm panel", async () => {
    vi.mocked(fetchSignInMethods).mockResolvedValue([]);
    vi.mocked(requestEmailLinkChallenge).mockResolvedValue({ challengeId: "challenge-1" });
    vi.mocked(verifyEmailLinkChallenge).mockResolvedValue(pendingProposal);

    render(<AccountSecurityPageClient />);

    fireEvent.change(await screen.findByLabelText("Email for one-time code"), {
      target: { value: "you@example.com" },
    });
    fireEvent.click(screen.getByTestId("account-security-send-code"));
    await waitFor(() => {
      expect(screen.getByLabelText("Verification code")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByTestId("account-security-verify-code"));

    const panel = await screen.findByTestId("account-security-confirm-panel");

    expect(panel.className).not.toMatch(/bg-amber-50/);
    expect(panel.className).not.toMatch(/bg-red-50/);
    expect(panel.className).not.toMatch(/bg-teal-50/);
  });
});
