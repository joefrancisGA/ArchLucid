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
  usePathname: () => "/auth/session-expired",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

const isJwtAuthModeMock = vi.hoisted(() => vi.fn(() => true));
const assertOidcSignInConfigMock = vi.hoisted(() => vi.fn(() => ({ ok: true as const })));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: isJwtAuthModeMock,
  assertOidcSignInConfig: assertOidcSignInConfigMock,
  getOidcAuthority: vi.fn(() => "https://login.example.com"),
  getOidcClientId: vi.fn(() => "test-client-id"),
  getOidcRedirectUri: vi.fn(() => "https://app.example.com/auth/callback"),
  getOidcScopes: vi.fn(() => "openid profile email"),
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
// Component under test — real `@/lib/oidc/session` (not mocked), so this
// also exercises the real returnUrl open-redirect protection end-to-end.
// -------------------------------------------------------------------

import { SessionExpiredClient } from "@/app/(operator)/auth/session-expired/SessionExpiredClient";
import { SESSION_IDLE_TIMEOUT_MINUTES } from "@/lib/auth/session-idle-timeout";
import { consumePostSignInReturnUrl } from "@/lib/oidc/session";

function setSearchParams(params: Record<string, string>) {
  searchParamsMock.value = new URLSearchParams(params);
}

function clearSearchParams() {
  searchParamsMock.value = new URLSearchParams();
}

describe("SessionExpiredClient", () => {
  beforeEach(() => {
    vi.stubGlobal("location", {
      assign: vi.fn(),
      replace: vi.fn(),
      href: "http://localhost/auth/session-expired",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    clearSearchParams();
    sessionStorage.clear();
  });

  it("defaults to idle-timeout copy when no reason is given", () => {
    clearSearchParams();

    render(<SessionExpiredClient />);

    expect(screen.getByTestId("auth-flow-shell")).toBeInTheDocument();
    expect(screen.getByLabelText("ArchLucid — welcome")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your session expired");
    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Your session expired");
    expect(
      screen.getByText(
        new RegExp(
          `for your security, archlucid signed you out after ${SESSION_IDLE_TIMEOUT_MINUTES} minutes of inactivity`,
          "i",
        ),
      ),
    ).toBeInTheDocument();
  });

  it("never auto-redirects — requires an explicit Sign in click", () => {
    clearSearchParams();

    render(<SessionExpiredClient />);

    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("renders the Sign in button using the primary variant", () => {
    clearSearchParams();

    render(<SessionExpiredClient />);

    const button = screen.getByTestId("session-expired-sign-in");

    expect(button.className).toContain("var(--al-primary-action-bg)");
  });

  it("renders an app-home secondary exit link (TB-1315)", () => {
    clearSearchParams();

    render(<SessionExpiredClient />);

    expect(screen.getByTestId("session-expired-return-home")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("session-expired-return-home")).toHaveTextContent("Back to ArchLucid");
  });

  it("stores a safe returnUrl and starts OIDC when Sign in is clicked", async () => {
    setSearchParams({ returnUrl: "/architecture/reviews/123" });

    render(<SessionExpiredClient />);

    fireEvent.click(screen.getByTestId("session-expired-sign-in"));

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith("https://login.example.com/authorize?foo=bar");
    });

    expect(consumePostSignInReturnUrl()).toBe("/architecture/reviews/123");
  });

  it("drops an unsafe protocol-relative returnUrl instead of storing it", async () => {
    setSearchParams({ returnUrl: "//evil.example" });

    render(<SessionExpiredClient />);

    fireEvent.click(screen.getByTestId("session-expired-sign-in"));

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith("https://login.example.com/authorize?foo=bar");
    });

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("drops an unsafe absolute external returnUrl instead of storing it", async () => {
    setSearchParams({ returnUrl: "https://evil.example/phish" });

    render(<SessionExpiredClient />);

    fireEvent.click(screen.getByTestId("session-expired-sign-in"));

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith("https://login.example.com/authorize?foo=bar");
    });

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("supports an explicit reason override for other session-message reasons", () => {
    setSearchParams({ reason: "unauthorized" });

    render(<SessionExpiredClient />);

    expect(screen.getByText(/you need to sign in to access that page/i)).toBeInTheDocument();
  });

  it("TB-1316: frames OIDC failures honestly and retries sign-in with returnUrl preserved", async () => {
    isJwtAuthModeMock.mockReturnValueOnce(false).mockReturnValue(true);
    setSearchParams({ returnUrl: "/architecture/reviews/123" });

    render(<SessionExpiredClient />);
    fireEvent.click(screen.getByTestId("session-expired-sign-in"));

    expect(screen.getByRole("heading", { name: "Sign-in could not start" })).toBeInTheDocument();
    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.queryByText("Access request")).toBeNull();

    fireEvent.click(screen.getByTestId("auth-error-try-again"));

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith("https://login.example.com/authorize?foo=bar");
    });

    expect(consumePostSignInReturnUrl()).toBe("/architecture/reviews/123");
  });
});
