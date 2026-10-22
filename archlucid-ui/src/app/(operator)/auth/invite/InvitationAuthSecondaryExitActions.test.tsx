import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvitationAuthSecondaryExitActions } from "@/app/(operator)/auth/invite/InvitationAuthSecondaryExitActions";
import {
  AUTH_INVITE_HELP_LABEL,
  AUTH_INVITE_PUBLIC_EXIT_LABEL,
  AUTH_INVITE_SIGN_IN_AGAIN_LABEL,
  AUTH_INVITE_USE_DIFFERENT_ACCOUNT_LABEL,
} from "@/lib/auth/invitation-auth-secondary-exit-copy";

const clearInvitationToken = vi.fn();
const clearOidcSession = vi.fn();
const signOutAndRedirectHome = vi.fn();

vi.mock("@/lib/auth/email-otp-session", () => ({
  clearInvitationToken: (...args: unknown[]) => clearInvitationToken(...args),
}));

vi.mock("@/lib/oidc/session", () => ({
  clearOidcSession: (...args: unknown[]) => clearOidcSession(...args),
  signOutAndRedirectHome: (...args: unknown[]) => signOutAndRedirectHome(...args),
}));

describe("InvitationAuthSecondaryExitActions (TB-1476)", () => {
  beforeEach(() => {
    clearInvitationToken.mockReset();
    clearOidcSession.mockReset();
    signOutAndRedirectHome.mockReset();
  });

  it("exposes secondary exits for valid invite states", () => {
    render(<InvitationAuthSecondaryExitActions />);

    expect(screen.getByTestId("invitation-secondary-exit")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-secondary-sign-in-again")).toHaveTextContent(
      AUTH_INVITE_SIGN_IN_AGAIN_LABEL,
    );
    expect(screen.getByTestId("invitation-secondary-use-different-account")).toHaveTextContent(
      AUTH_INVITE_USE_DIFFERENT_ACCOUNT_LABEL,
    );
    expect(screen.getByTestId("invitation-secondary-help")).toHaveTextContent(AUTH_INVITE_HELP_LABEL);
    expect(screen.getByTestId("invitation-secondary-public-exit")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("invitation-secondary-public-exit")).toHaveTextContent(
      AUTH_INVITE_PUBLIC_EXIT_LABEL,
    );
  });

  it("omits sign-in again when invalid recovery already exposes sign-in", () => {
    render(<InvitationAuthSecondaryExitActions showSignInAgain={false} />);

    expect(screen.queryByTestId("invitation-secondary-sign-in-again")).toBeNull();
    expect(screen.getByTestId("invitation-secondary-use-different-account")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-secondary-help")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-secondary-public-exit")).toBeInTheDocument();
  });

  it("clears OIDC session before sign-in again", () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });

    render(<InvitationAuthSecondaryExitActions />);

    fireEvent.click(screen.getByTestId("invitation-secondary-sign-in-again"));

    expect(clearOidcSession).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith("/auth/signin");
  });

  it("clears the invitation token before switching accounts", () => {
    render(<InvitationAuthSecondaryExitActions showSignInAgain={false} />);

    fireEvent.click(screen.getByTestId("invitation-secondary-use-different-account"));

    expect(clearInvitationToken).toHaveBeenCalledTimes(1);
    expect(signOutAndRedirectHome).toHaveBeenCalledTimes(1);
  });
});
