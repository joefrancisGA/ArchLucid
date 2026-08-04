import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsMock = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => searchParamsMock.value,
    usePathname: () => "/",
  };
});

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: vi.fn(() => true),
  assertOidcSignInConfig: vi.fn(() => ({ ok: true as const })),
  getOidcAuthority: vi.fn(() => "https://login.example.com"),
  getOidcClientId: vi.fn(() => "client-id"),
  getOidcRedirectUri: vi.fn(() => "https://app.example.com/auth/callback"),
}));

vi.mock("@/lib/oidc/discovery", () => ({
  loadDiscoveryDocument: vi.fn(async () => ({
    token_endpoint: "https://login.example.com/token",
  })),
}));

vi.mock("@/lib/oidc/token-client", () => ({
  exchangeAuthorizationCode: vi.fn(),
}));

vi.mock("@/lib/oidc/session", () => ({
  consumePkceState: vi.fn(),
  persistTokenResponse: vi.fn(),
  consumePostSignInReturnUrl: vi.fn(() => "/"),
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
import { consumePkceState } from "@/lib/oidc/session";
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
    });
    vi.mocked(exchangeAuthorizationCode).mockReturnValueOnce(new Promise(() => undefined));

    render(<CallbackClient />);

    expect(screen.getByTestId("auth-flow-shell")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: AUTH_CALLBACK_PAGE_TITLE })).toBeInTheDocument();
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
    expect(screen.queryByRole("link", { name: "Back to sign in" })).toBeNull();
  });
});
