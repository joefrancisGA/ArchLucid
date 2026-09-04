import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_CALLBACK_CLAIM_DISCIPLINE_HEADING,
  AUTH_CALLBACK_FOLLOW_UPS_TITLE,
} from "@/lib/auth-callback-evidence-copy";
import {
  AUTH_CALLBACK_PRIMARY_CONTENT_ID,
  AUTH_CALLBACK_SKIP_LINK_LABEL,
} from "@/lib/auth/auth-callback-page-copy";

const searchParamsMock = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useSearchParams: () => searchParamsMock.value,
    usePathname: () => "/auth/callback",
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
import { consumePkceState } from "@/lib/oidc/session";
import { exchangeAuthorizationCode } from "@/lib/oidc/token-client";

describe("CallbackClient buyer-polished shell", () => {
  beforeEach(() => {
    searchParamsMock.value = new URLSearchParams({
      code: "auth-code",
      state: "state-value",
    });

    vi.mocked(consumePkceState).mockReturnValue({
      state: "state-value",
      codeVerifier: "verifier",
      nonce: "nonce",
      flow: "primary",
    });
    vi.mocked(exchangeAuthorizationCode).mockReturnValue(new Promise(() => undefined));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders skip link, breadcrumb, callback body, then orientation below the panel", () => {
    render(<CallbackClient />);

    expect(screen.getByRole("link", { name: AUTH_CALLBACK_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_CALLBACK_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("auth-callback-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUTH_CALLBACK_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const orientation = screen.getByTestId("auth-callback-orientation-bottom");
    const loading = screen.getByTestId("auth-callback-loading");

    expect(orientation.compareDocumentPosition(loading) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("renders orientation below the access panel on callback failure", async () => {
    searchParamsMock.value = new URLSearchParams();
    vi.mocked(consumePkceState).mockReturnValueOnce(null);

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    const orientation = screen.getByTestId("auth-callback-orientation-bottom");
    const accessPanel = screen.getByTestId("auth-callback-access-panel");

    expect(orientation.compareDocumentPosition(accessPanel) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });
});
