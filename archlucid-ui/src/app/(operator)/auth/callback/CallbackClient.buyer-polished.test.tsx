import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_CALLBACK_CLAIM_DISCIPLINE,
  AUTH_CALLBACK_FOLLOW_UPS_TITLE,
  AUTH_CALLBACK_SOURCES,
} from "@/lib/auth-callback-evidence-copy";
import {
  AUTH_CALLBACK_FIRST_VIEWPORT_ID,
  AUTH_CALLBACK_PRIMARY_CONTENT_ID,
  AUTH_CALLBACK_SKIP_LINK_LABEL,
  AUTH_CALLBACK_SKIP_TARGET_ID,
} from "@/lib/auth/auth-callback-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

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

  it("renders skip link, orientation above callback body, and Sources below the panel", () => {
    render(<CallbackClient />);

    expect(screen.getByRole("link", { name: AUTH_CALLBACK_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_CALLBACK_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("auth-callback-primary-content")).toHaveAttribute(
      "id",
      AUTH_CALLBACK_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("auth-callback-breadcrumb")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("auth-callback-primary-content");
    const firstViewport = screen.getByTestId(AUTH_CALLBACK_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("auth-callback-orientation-top");
    const loading = screen.getByTestId("auth-callback-loading");
    const orientationBottom = screen.getByTestId("auth-callback-orientation-bottom");
    const sourcesSection = screen.getByTestId("auth-callback-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(loading);
    expect(orientationTop.compareDocumentPosition(loading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      orientationBottom.compareDocumentPosition(loading) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();

    expect(within(orientationTop).getByTestId("auth-callback-claim-discipline").textContent).toContain(
      AUTH_CALLBACK_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: AUTH_CALLBACK_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(AUTH_CALLBACK_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });

  it("renders orientation below the access panel on callback failure", async () => {
    searchParamsMock.value = new URLSearchParams();
    vi.mocked(consumePkceState).mockReturnValueOnce(null);

    render(<CallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-panel")).toBeInTheDocument();
    });

    const orientationBottom = screen.getByTestId("auth-callback-orientation-bottom");
    const accessPanel = screen.getByTestId("auth-callback-access-panel");
    const orientationTop = screen.getByTestId("auth-callback-orientation-top");

    expect(orientationTop.compareDocumentPosition(accessPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      orientationBottom.compareDocumentPosition(accessPanel) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });
});
