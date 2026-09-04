import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_SIGNIN_FOLLOW_UPS_TITLE,
} from "@/lib/auth-signin-evidence-copy";
import {
  AUTH_SIGNIN_PRIMARY_CONTENT_ID,
  AUTH_SIGNIN_SKIP_LINK_LABEL,
} from "@/lib/auth/auth-signin-page-copy";

const searchParamsMock = vi.hoisted(() => ({ value: new URLSearchParams() }));
const resolveOptionsMock = vi.hoisted(() =>
  vi.fn(() => ({
    workSchool: true,
    emailCode: true,
    supplementalProviders: [] as const,
  })),
);

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

vi.mock("@/lib/auth/sign-in-method-options", () => ({
  resolveSignInMethodOptions: resolveOptionsMock,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: vi.fn(() => false),
  persistTokenResponse: vi.fn(),
}));

vi.mock("@/lib/oidc/config", () => ({
  assertOidcSignInConfig: vi.fn(() => ({ ok: true as const })),
}));

vi.mock("@/lib/oidc/initiate-redirect", () => ({
  initiateOidcRedirect: vi.fn(async () => undefined),
  initiateSupplementalOidcRedirect: vi.fn(),
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

vi.mock("@/lib/auth/turnstile-config", () => ({
  isTurnstileBotChallengeConfigured: vi.fn(() => false),
  readTurnstileSiteKey: vi.fn(() => null),
}));

import { SignInClient } from "@/app/(operator)/auth/signin/SignInClient";

describe("SignInClient buyer-polished shell", () => {
  beforeEach(() => {
    searchParamsMock.value = new URLSearchParams();
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

  it("renders skip link, method picker, claim discipline, then orientation below the panel", () => {
    render(<SignInClient />);

    expect(screen.getByRole("link", { name: AUTH_SIGNIN_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_SIGNIN_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("auth-signin-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUTH_SIGNIN_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const orientation = screen.getByTestId("auth-signin-orientation-bottom");
    const methodPicker = screen.getByTestId("sign-in-method-picker");

    expect(orientation.compareDocumentPosition(methodPicker) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("renders orientation below the session recovery panel when reason is present", () => {
    searchParamsMock.value = new URLSearchParams("reason=idle-timeout");

    render(<SignInClient />);

    const orientation = screen.getByTestId("auth-signin-orientation-bottom");
    const sessionView = screen.getByTestId("session-expired-view");

    expect(orientation.compareDocumentPosition(sessionView) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });
});
