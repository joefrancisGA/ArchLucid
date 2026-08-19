import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestChallengeMock = vi.hoisted(() => vi.fn());
const verifyCodeMock = vi.hoisted(() => vi.fn());
const resolveOptionsMock = vi.hoisted(() =>
  vi.fn(() => ({
    workSchool: true,
    emailCode: true,
    supplementalProviders: [] as const,
  })),
);
const isLikelySignedInMock = vi.hoisted(() => vi.fn(() => false));
const persistTokenMock = vi.hoisted(() => vi.fn());
const initiateOidcMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/auth/email-otp-api", () => ({
  requestEmailOtpChallenge: requestChallengeMock,
  verifyEmailOtpCode: verifyCodeMock,
}));

vi.mock("@/lib/auth/sign-in-method-options", () => ({
  resolveSignInMethodOptions: resolveOptionsMock,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: isLikelySignedInMock,
  persistTokenResponse: persistTokenMock,
}));

vi.mock("@/lib/oidc/config", () => ({
  assertOidcSignInConfig: vi.fn(() => ({ ok: true as const })),
}));

vi.mock("@/lib/oidc/initiate-redirect", () => ({
  initiateOidcRedirect: initiateOidcMock,
  initiateSupplementalOidcRedirect: vi.fn(),
}));

vi.mock("@/lib/auth/email-otp-session", () => ({
  readEmailOtpChallengeSession: vi.fn(() => null),
  storeEmailOtpChallengeSession: vi.fn(),
  clearEmailOtpChallengeSession: vi.fn(),
  readInvitationToken: vi.fn(() => "invite-token"),
  storeInvitationToken: vi.fn(),
}));

vi.mock("@/lib/auth/email-otp-resend", () => ({
  readEmailOtpResendCooldown: vi.fn(() => ({ active: false, secondsRemaining: 0 })),
  markEmailOtpResendSent: vi.fn(),
}));

vi.mock("@/lib/auth/turnstile-config", () => ({
  isTurnstileBotChallengeConfigured: vi.fn(() => false),
  readTurnstileSiteKey: vi.fn(() => null),
}));

import { SignInFlowClient } from "@/app/(operator)/auth/signin/SignInFlowClient";

describe("SignInFlowClient", () => {
  beforeEach(() => {
    vi.stubGlobal("location", {
      assign: vi.fn(),
      replace: vi.fn(),
      href: "http://localhost/auth/signin",
    });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows method picker with work/school and email options", () => {
    render(<SignInFlowClient returnUrl="/architecture/reviews/1" />);

    expect(screen.getByTestId("sign-in-method-picker")).toBeInTheDocument();
    expect(screen.getByTestId("sign-in-work-school")).toBeInTheDocument();
    expect(screen.getByTestId("sign-in-email-code")).toBeInTheDocument();
    expect(screen.getByTestId("auth-flow-return-destination-hint")).toBeInTheDocument();
  });

  it("omits return destination hint for root return URLs", () => {
    render(<SignInFlowClient returnUrl="/" />);

    expect(screen.queryByTestId("auth-flow-return-destination-hint")).toBeNull();
  });

  it("starts OIDC for work/school selection", async () => {
    render(<SignInFlowClient returnUrl="/architecture/reviews/1" />);

    fireEvent.click(screen.getByTestId("sign-in-work-school"));

    await waitFor(() => {
      expect(initiateOidcMock).toHaveBeenCalledWith("/architecture/reviews/1");
    });
  });

  it("walks through email and code steps", async () => {
    requestChallengeMock.mockResolvedValueOnce({
      kind: "success",
      response: {
        message: "If that address can receive email, we sent a sign-in code.",
        challengeId: "11111111-1111-1111-1111-111111111111",
        ssoRequired: false,
      },
    });

    render(<SignInFlowClient />);

    fireEvent.click(screen.getByTestId("sign-in-email-code"));
    fireEvent.change(screen.getByTestId("sign-in-email-input"), {
      target: { value: "ops@example.com" },
    });
    fireEvent.click(screen.getByTestId("sign-in-send-code"));

    await waitFor(() => {
      expect(screen.getByTestId("sign-in-code-step")).toBeInTheDocument();
    });

    expect(screen.getByText(/o\*\*\*@example\.com/i)).toBeInTheDocument();
    expect(requestChallengeMock).toHaveBeenCalledWith("ops@example.com", "invite-token", null);
  });

  it("shows SSO required step when domain policy requires organization sign-in", async () => {
    requestChallengeMock.mockResolvedValueOnce({
      kind: "success",
      response: {
        message: "Use your organization sign-in.",
        ssoRequired: true,
      },
    });

    render(<SignInFlowClient />);

    fireEvent.click(screen.getByTestId("sign-in-email-code"));
    fireEvent.change(screen.getByTestId("sign-in-email-input"), {
      target: { value: "user@contoso.com" },
    });
    fireEvent.click(screen.getByTestId("sign-in-send-code"));

    await waitFor(() => {
      expect(screen.getByTestId("sign-in-sso-required-step")).toBeInTheDocument();
    });

    expect(screen.queryByText(/contoso/i)).toBeNull();
  });

  it("completes verification and redirects safely", async () => {
    requestChallengeMock.mockResolvedValueOnce({
      kind: "success",
      response: {
        message: "sent",
        challengeId: "11111111-1111-1111-1111-111111111111",
        ssoRequired: false,
      },
    });

    verifyCodeMock.mockResolvedValueOnce({
      kind: "success",
      response: {
        accessToken: "jwt",
        tokenType: "Bearer",
        expiresInSeconds: 3600,
        platformUserId: "user-1",
        nextStep: "Complete",
      },
    });

    render(<SignInFlowClient returnUrl="/architecture/reviews/1" />);

    fireEvent.click(screen.getByTestId("sign-in-email-code"));
    fireEvent.change(screen.getByTestId("sign-in-email-input"), {
      target: { value: "ops@example.com" },
    });
    fireEvent.click(screen.getByTestId("sign-in-send-code"));

    await waitFor(() => {
      expect(screen.getByTestId("sign-in-code-input")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("sign-in-code-input"), { target: { value: "123456" } });
    fireEvent.click(screen.getByTestId("sign-in-code-continue"));

    await waitFor(() => {
      expect(persistTokenMock).toHaveBeenCalled();
      expect(window.location.replace).toHaveBeenCalledWith("/architecture/reviews/1");
    });
  });

  it("shows sanitized invalid code message", async () => {
    requestChallengeMock.mockResolvedValueOnce({
      kind: "success",
      response: {
        message: "sent",
        challengeId: "11111111-1111-1111-1111-111111111111",
        ssoRequired: false,
      },
    });

    verifyCodeMock.mockResolvedValueOnce({
      kind: "failure",
      category: "invalid_code",
    });

    render(<SignInFlowClient />);

    fireEvent.click(screen.getByTestId("sign-in-email-code"));
    fireEvent.change(screen.getByTestId("sign-in-email-input"), {
      target: { value: "ops@example.com" },
    });
    fireEvent.click(screen.getByTestId("sign-in-send-code"));

    await waitFor(() => {
      expect(screen.getByTestId("sign-in-code-input")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("sign-in-code-input"), { target: { value: "000000" } });
    fireEvent.click(screen.getByTestId("sign-in-code-continue"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/not correct/i);
    });
  });

  it("routes invitation next step to signup", async () => {
    requestChallengeMock.mockResolvedValueOnce({
      kind: "success",
      response: {
        message: "sent",
        challengeId: "11111111-1111-1111-1111-111111111111",
        ssoRequired: false,
      },
    });

    verifyCodeMock.mockResolvedValueOnce({
      kind: "success",
      response: {
        accessToken: "jwt",
        tokenType: "Bearer",
        expiresInSeconds: 3600,
        platformUserId: "user-1",
        nextStep: "AcceptInvitation",
      },
    });

    render(<SignInFlowClient />);

    fireEvent.click(screen.getByTestId("sign-in-email-code"));
    fireEvent.change(screen.getByTestId("sign-in-email-input"), {
      target: { value: "ops@example.com" },
    });
    fireEvent.click(screen.getByTestId("sign-in-send-code"));

    await waitFor(() => {
      expect(screen.getByTestId("sign-in-code-input")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("sign-in-code-input"), { target: { value: "123456" } });
    fireEvent.click(screen.getByTestId("sign-in-code-continue"));

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith("/auth/bootstrap");
    });
  });

  it("exposes accessible labels on email step", () => {
    render(<SignInFlowClient />);

    fireEvent.click(screen.getByTestId("sign-in-email-code"));

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("exposes accessible labels on code step", async () => {
    requestChallengeMock.mockResolvedValueOnce({
      kind: "success",
      response: {
        message: "sent",
        challengeId: "11111111-1111-1111-1111-111111111111",
        ssoRequired: false,
      },
    });

    render(<SignInFlowClient />);

    fireEvent.click(screen.getByTestId("sign-in-email-code"));
    fireEvent.change(screen.getByTestId("sign-in-email-input"), {
      target: { value: "ops@example.com" },
    });
    fireEvent.click(screen.getByTestId("sign-in-send-code"));

    await waitFor(() => {
      expect(screen.getByLabelText("Sign-in code")).toBeInTheDocument();
    });
  });
});
