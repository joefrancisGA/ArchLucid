import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsMock = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => searchParamsMock.value,
    usePathname: () => "/auth/callback",
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  };
});

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: vi.fn(() => true),
  assertOidcSignInConfig: vi.fn(() => ({ ok: true as const })),
  getOidcAuthority: vi.fn(() => "https://login.example.com"),
  getOidcClientId: vi.fn(() => "client-id"),
  getGoogleOidcAuthority: vi.fn(() => "https://accounts.google.com"),
  getGoogleOidcClientId: vi.fn(() => "google-client-id"),
  getOidcRedirectUri: vi.fn(() => "https://app.example.com/auth/callback"),
}));

vi.mock("@/lib/oidc/discovery", () => ({
  loadDiscoveryDocument: vi.fn(async () => ({
    token_endpoint: "https://login.example.com/token",
  })),
}));

vi.mock("@/lib/oidc/token-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/oidc/token-client")>();

  return {
    ...actual,
    exchangeAuthorizationCode: vi.fn(),
  };
});

vi.mock("@/lib/oidc/session", () => ({
  consumePkceState: vi.fn(),
  persistTokenResponse: vi.fn(),
  consumePostSignInReturnUrl: vi.fn(() => "/"),
  markAuthorizeCallbackFailed: vi.fn(),
}));

vi.mock("@/lib/auth/email-otp-session", () => ({
  readInvitationToken: vi.fn(() => null),
}));

vi.mock("@/lib/registration-session", () => ({
  clearLastRegistrationPayload: vi.fn(),
}));

import { CallbackClient } from "@/app/(operator)/auth/callback/CallbackClient";
import { AUTH_CALLBACK_ACCESS_HEADING } from "@/lib/auth/access-request-copy";
import { AUTH_CALLBACK_PAGE_TITLE } from "@/lib/auth/auth-callback-page-copy";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import { assertOidcSignInConfig, getGoogleOidcClientId } from "@/lib/oidc/config";
import { consumePkceState, markAuthorizeCallbackFailed } from "@/lib/oidc/session";
import { exchangeAuthorizationCode } from "@/lib/oidc/token-client";

describe("CallbackClient", () => {
  beforeEach(() => {
    searchParamsMock.value = new URLSearchParams();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders branded loading chrome while token exchange is in progress", () => {
    searchParamsMock.value = new URLSearchParams({
      code: "auth-code",
      state: "state-value",
    });

    vi.mocked(consumePkceState).mockReturnValueOnce({
      state: "state-value",
      codeVerifier: "verifier",
      nonce: "nonce",
      flow: "primary",
    });
    vi.mocked(exchangeAuthorizationCode).mockReturnValueOnce(new Promise(() => undefined));

    render(<CallbackClient />);

    expect(screen.getByTestId("auth-flow-shell")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: AUTH_CALLBACK_PAGE_TITLE })).toBeInTheDocument();
  });

  it("exchanges Google callbacks with the Google client id and discovery authority", async () => {
    searchParamsMock.value = new URLSearchParams({
      code: "auth-code",
      state: "google-state",
    });

    vi.mocked(consumePkceState).mockReturnValueOnce({
      state: "google-state",
      codeVerifier: "google-verifier",
      nonce: "google-nonce",
      flow: "google",
    });
    vi.mocked(exchangeAuthorizationCode).mockResolvedValueOnce({
      access_token: "access-token",
      expires_in: 3600,
    });

    const replaceMock = vi.fn();
    vi.stubGlobal("location", { replace: replaceMock });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(exchangeAuthorizationCode).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: getGoogleOidcClientId(),
          codeVerifier: "google-verifier",
        }),
      );
    });

    expect(loadDiscoveryDocument).toHaveBeenCalledWith("https://accounts.google.com");
  });

  it("trims accidental control characters from the authorization code before token exchange", async () => {
    searchParamsMock.value = new URLSearchParams({
      code: "auth-code\u000B",
      state: "state-value",
    });

    vi.mocked(consumePkceState).mockReturnValueOnce({
      state: "state-value",
      codeVerifier: "verifier",
      nonce: "nonce",
      flow: "primary",
    });
    vi.mocked(exchangeAuthorizationCode).mockResolvedValueOnce({
      access_token: "access-token",
      expires_in: 3600,
    });

    const replaceMock = vi.fn();
    vi.stubGlobal("location", { replace: replaceMock });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(exchangeAuthorizationCode).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "auth-code",
        }),
      );
    });
  });

  it("does not mark authorize callback failed when token exchange rejects an invalid token endpoint URL", async () => {
    searchParamsMock.value = new URLSearchParams({
      code: "auth-code",
      state: "state-value",
    });

    vi.mocked(consumePkceState).mockReturnValueOnce({
      state: "state-value",
      codeVerifier: "verifier",
      nonce: "nonce",
      flow: "primary",
    });
    vi.mocked(exchangeAuthorizationCode).mockRejectedValueOnce(
      new Error("Invalid token endpoint URL"),
    );

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(markAuthorizeCallbackFailed).not.toHaveBeenCalled();
  });

  it("marks authorize callback failed when sign-in config is invalid but the IdP returned an authorization code", async () => {
    vi.mocked(assertOidcSignInConfig).mockReturnValueOnce({
      ok: false,
      message: "OIDC is not configured.",
    });

    searchParamsMock.value = new URLSearchParams({
      code: "auth-code",
      state: "state-value",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
    expect(consumePkceState).not.toHaveBeenCalled();
  });

  it("marks authorize callback failed when the IdP returns an OAuth error", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "access_denied",
      error_description: "User+canceled",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
    expect(consumePkceState).not.toHaveBeenCalled();
  });

  it("does not exchange the authorization code when the authorize error_description query collapses to empty after decoding", async () => {
    searchParamsMock.value = new URLSearchParams({
      error_description: "\u0007",
      code: "auth-code",
      state: "state-value",
    });

    vi.mocked(consumePkceState).mockReturnValueOnce({
      state: "state-value",
      codeVerifier: "verifier",
      nonce: "nonce",
      flow: "primary",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/complete response from your identity provider/i)).toBeInTheDocument();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("does not exchange the authorization code when the authorize error query is present but empty", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "",
      code: "auth-code",
      state: "state-value",
    });

    vi.mocked(consumePkceState).mockReturnValueOnce({
      state: "state-value",
      codeVerifier: "verifier",
      nonce: "nonce",
      flow: "primary",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/complete response from your identity provider/i)).toBeInTheDocument();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("does not exchange the authorization code when the authorize error query collapses to empty after normalization", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "\u0007",
      code: "auth-code",
      state: "state-value",
    });

    vi.mocked(consumePkceState).mockReturnValueOnce({
      state: "state-value",
      codeVerifier: "verifier",
      nonce: "nonce",
      flow: "primary",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows canceled sign-in copy when the authorize error query contains trailing control characters", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "access_denied\u000b",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/canceled sign-in/i)).toBeInTheDocument();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows canceled-sign-in copy without NaN detail when access_denied has error_description=NaN", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "access_denied",
      error_description: "NaN",
      state: "state-value",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/canceled sign-in/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sign-in stopped:\s*NaN/i)).toBeNull();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows canceled-sign-in copy without null detail when access_denied has error_description=null", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "access_denied",
      error_description: "null",
      state: "state-value",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/canceled sign-in/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sign-in stopped:\s*null/i)).toBeNull();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows incomplete IdP copy when the authorize error query is -Infinity", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "-Infinity",
      state: "state-value",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/complete response from your identity provider/i)).toBeInTheDocument();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows incomplete IdP copy when the authorize error query is Infinity", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "Infinity",
      state: "state-value",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/complete response from your identity provider/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sign-in did not finish \(infinity\)/i)).toBeNull();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows canceled-sign-in copy without object-coercion detail when access_denied has error_description=[object Object]", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "access_denied",
      error_description: "[object Object]",
      state: "state-value",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/canceled sign-in/i)).toBeInTheDocument();
    expect(screen.queryByText(/\[object Object\]/i)).toBeNull();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows incomplete IdP copy when the authorize error query is the literal true string", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "true",
      state: "state-value",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/complete response from your identity provider/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sign-in did not finish \(true\)/i)).toBeNull();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows incomplete IdP copy when the authorize error query is the literal undefined string", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "undefined",
      state: "state-value",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/complete response from your identity provider/i)).toBeInTheDocument();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows incomplete IdP copy when the authorize error query is the literal null string", async () => {
    searchParamsMock.value = new URLSearchParams({
      error: "null",
      state: "state-value",
    });

    vi.mocked(consumePkceState).mockReturnValueOnce({
      state: "state-value",
      codeVerifier: "verifier",
      nonce: "nonce",
      flow: "primary",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/complete response from your identity provider/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sign-in did not finish \(null\)/i)).toBeNull();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows incomplete IdP copy when the authorize code query is whitespace-only", async () => {
    searchParamsMock.value = new URLSearchParams({
      code: "   ",
      state: "state-value",
    });

    vi.mocked(consumePkceState).mockReturnValueOnce({
      state: "state-value",
      codeVerifier: "verifier",
      nonce: "nonce",
      flow: "primary",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/complete response from your identity provider/i)).toBeInTheDocument();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(consumePkceState).toHaveBeenCalledTimes(1);
    expect(consumePkceState).toHaveBeenCalledWith("state-value");
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows incomplete IdP copy when the authorize state query is whitespace-only", async () => {
    searchParamsMock.value = new URLSearchParams({
      code: "auth-code",
      state: "   ",
    });

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByText(/complete response from your identity provider/i)).toBeInTheDocument();
    expect(screen.queryByText(/expired or was started in another window/i)).toBeNull();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(consumePkceState).not.toHaveBeenCalled();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("shows the access panel when the callback is missing required parameters", async () => {
    searchParamsMock.value = new URLSearchParams();
    vi.mocked(consumePkceState).mockReturnValueOnce(null);

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { level: 1, name: AUTH_CALLBACK_ACCESS_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/auth/signin");
    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Back to sign in" })).toBeNull();
    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
  });

  it("marks authorize callback failed when sign-in config is invalid and the callback query is empty", async () => {
    vi.mocked(assertOidcSignInConfig).mockReturnValueOnce({
      ok: false,
      message: "OIDC is not configured.",
    });

    searchParamsMock.value = new URLSearchParams();

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    expect(markAuthorizeCallbackFailed).toHaveBeenCalledTimes(1);
    expect(consumePkceState).not.toHaveBeenCalled();
  });
});
