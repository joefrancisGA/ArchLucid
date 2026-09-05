import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// -------------------------------------------------------------------
// Hoisted mocks — must be declared before any imports that depend on them.
// -------------------------------------------------------------------

const searchParamsMock = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useSearchParams: () => searchParamsMock.value,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/auth/signin",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

const isJwtAuthModeMock = vi.hoisted(() => vi.fn(() => true));
const assertOidcSignInConfigMock = vi.hoisted(() => vi.fn(() => ({ ok: true as const })));
const getOidcAuthorityMock = vi.hoisted(() => vi.fn(() => "https://login.example.com"));
const getOidcClientIdMock = vi.hoisted(() => vi.fn(() => "test-client-id"));
const getOidcRedirectUriMock = vi.hoisted(() => vi.fn(() => "https://app.example.com/auth/callback"));
const getOidcScopesMock = vi.hoisted(() => vi.fn(() => "openid profile email"));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: isJwtAuthModeMock,
  assertOidcSignInConfig: assertOidcSignInConfigMock,
  getOidcAuthority: getOidcAuthorityMock,
  getOidcClientId: getOidcClientIdMock,
  getOidcRedirectUri: getOidcRedirectUriMock,
  getOidcScopes: getOidcScopesMock,
}));

const isLikelySignedInMock = vi.hoisted(() => vi.fn(() => false));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: isLikelySignedInMock,
  storePkceState: vi.fn(),
  storePostSignInReturnUrl: vi.fn(),
  persistTokenResponse: vi.fn(),
}));

vi.mock("@/lib/auth/sign-in-method-options", () => ({
  resolveSignInMethodOptions: vi.fn(() => ({
    workSchool: true,
    emailCode: true,
    supplementalProviders: [],
  })),
}));

vi.mock("@/lib/auth/email-otp-api", () => ({
  requestEmailOtpChallenge: vi.fn(),
  verifyEmailOtpCode: vi.fn(),
}));

vi.mock("@/lib/auth/email-otp-session", () => ({
  readEmailOtpChallengeSession: vi.fn(() => null),
  storeEmailOtpChallengeSession: vi.fn(),
  clearEmailOtpChallengeSession: vi.fn(),
  readInvitationToken: vi.fn(() => null),
  storeInvitationToken: vi.fn(),
}));

vi.mock("@/lib/auth/email-otp-resend", () => ({
  readEmailOtpResendCooldown: vi.fn(() => ({ active: false, secondsRemaining: 0 })),
  markEmailOtpResendSent: vi.fn(),
}));

vi.mock("@/lib/oidc/pkce", () => ({
  createPkcePair: vi.fn(async () => ({ verifier: "v", challenge: "c" })),
  randomOpaqueState: vi.fn(() => "opaque-state"),
}));

vi.mock("@/lib/oidc/discovery", () => ({
  loadDiscoveryDocument: vi.fn(async () => ({
    authorization_endpoint: "https://login.example.com/authorize",
    token_endpoint: "https://login.example.com/token",
  })),
}));

vi.mock("@/lib/oidc/build-authorize-url", () => ({
  buildAuthorizeUrl: vi.fn(() => "https://login.example.com/authorize?foo=bar"),
}));

// -------------------------------------------------------------------
// Component under test (imported after mocks are wired).
// -------------------------------------------------------------------

import { SignInClient } from "@/app/(operator)/auth/signin/SignInClient";
import { SESSION_IDLE_TIMEOUT_MINUTES } from "@/lib/auth/session-idle-timeout";
import { resolveSignInMethodOptions } from "@/lib/auth/sign-in-method-options";

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function setSearchParams(params: Record<string, string>) {
  searchParamsMock.value = new URLSearchParams(params);
}

function clearSearchParams() {
  searchParamsMock.value = new URLSearchParams();
}

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------

describe("SignInClient — idle-timeout session-expired view", () => {
  beforeEach(() => {
    vi.stubGlobal("location", {
      assign: vi.fn(),
      replace: vi.fn(),
      href: "http://localhost/auth/signin",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    clearSearchParams();
  });

  it("renders 'Your session expired' heading for reason=idle-timeout", () => {
    setSearchParams({ reason: "idle-timeout" });

    render(<SignInClient />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Your session expired");
  });

  it("renders inactivity explanation for reason=idle-timeout", () => {
    setSearchParams({ reason: "idle-timeout" });

    render(<SignInClient />);

    expect(
      screen.getByText(
        new RegExp(`signed you out after ${SESSION_IDLE_TIMEOUT_MINUTES} minutes of inactivity`, "i"),
      ),
    ).toBeInTheDocument();
  });

  it("does NOT render artifact 404 copy for reason=idle-timeout", () => {
    setSearchParams({ reason: "idle-timeout" });

    render(<SignInClient />);

    expect(screen.queryByText(/We could not find that ArchLucid artifact/i)).toBeNull();
  });

  it("does NOT render 'ARCHLUCID · 404' for reason=idle-timeout", () => {
    setSearchParams({ reason: "idle-timeout" });

    render(<SignInClient />);

    expect(screen.queryByText(/ARCHLUCID\s*·\s*404/i)).toBeNull();
  });

  it("renders a Sign in button for reason=idle-timeout", () => {
    setSearchParams({ reason: "idle-timeout" });

    render(<SignInClient />);

    expect(screen.getByTestId("session-expired-sign-in")).toBeInTheDocument();
  });

  it("does NOT auto-start OIDC redirect for reason=idle-timeout", () => {
    setSearchParams({ reason: "idle-timeout" });

    render(<SignInClient />);

    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("starts OIDC when Sign in button is clicked", async () => {
    setSearchParams({ reason: "idle-timeout" });

    render(<SignInClient />);

    fireEvent.click(screen.getByTestId("session-expired-sign-in"));

    await waitFor(() => {
      expect(screen.getByTestId("sign-in-method-picker")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("sign-in-work-school"));

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        "https://login.example.com/authorize?foo=bar",
      );
    });
  });

  it("renders the Sign in button using the primary variant, not a plain dark button", () => {
    setSearchParams({ reason: "idle-timeout" });

    render(<SignInClient />);

    const button = screen.getByTestId("session-expired-sign-in");

    expect(button.className).toContain("var(--al-primary-action-bg)");
    expect(button.className).not.toContain("bg-neutral-900");
  });

  it("still works for the legacy /auth/signin?reason=idle-timeout&returnUrl=%2F flow", () => {
    setSearchParams({ reason: "idle-timeout", returnUrl: "/" });

    render(<SignInClient />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Your session expired");
    expect(screen.getByTestId("session-expired-sign-in")).toBeInTheDocument();
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});

describe("SignInClient — other recognized session-message reasons", () => {
  beforeEach(() => {
    vi.stubGlobal("location", {
      assign: vi.fn(),
      replace: vi.fn(),
      href: "http://localhost/auth/signin",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    clearSearchParams();
  });

  it("renders session-expired copy without auto-redirecting", () => {
    setSearchParams({ reason: "session-expired" });

    render(<SignInClient />);

    expect(screen.getByText(/your session is no longer active/i)).toBeInTheDocument();
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("renders unauthorized copy without auto-redirecting", () => {
    setSearchParams({ reason: "unauthorized" });

    render(<SignInClient />);

    expect(screen.getByText(/you need to sign in to access that page/i)).toBeInTheDocument();
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("falls back to safe generic copy and does not echo an unrecognized reason value", () => {
    setSearchParams({ reason: "<script>alert(1)</script>" });

    render(<SignInClient />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Your session expired");
    expect(screen.getByText("Sign in again to continue.")).toBeInTheDocument();
    expect(screen.queryByText(/script/i)).toBeNull();
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});

describe("SignInClient — normal sign-in flow (no reason param)", () => {
  beforeEach(() => {
    vi.stubGlobal("location", {
      assign: vi.fn(),
      replace: vi.fn(),
      href: "http://localhost/auth/signin",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    clearSearchParams();
  });

  it("renders sign-in method picker instead of auto-redirecting", () => {
    clearSearchParams();

    render(<SignInClient />);

    expect(screen.getByTestId("sign-in-method-picker")).toBeInTheDocument();
    expect(screen.queryByTestId("session-expired-heading")).toBeNull();
  });

  it("starts OIDC only after work/school is selected", async () => {
    clearSearchParams();

    render(<SignInClient />);

    fireEvent.click(screen.getByTestId("sign-in-work-school"));

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        "https://login.example.com/authorize?foo=bar",
      );
    });
  });

  it("redirects to home when already signed in", () => {
    isLikelySignedInMock.mockReturnValueOnce(true);
    clearSearchParams();

    render(<SignInClient />);

    expect(window.location.replace).toHaveBeenCalledWith("/");
  });

  it("shows error state when no sign-in methods are configured", () => {
    vi.mocked(resolveSignInMethodOptions).mockReturnValueOnce({
      workSchool: false,
      emailCode: false,
      supplementalProviders: [],
    });
    clearSearchParams();

    render(<SignInClient />);

    expect(screen.getByText("Access request")).toBeInTheDocument();
  });
});
