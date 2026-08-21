import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_EXPIRED_FOLLOW_UPS_TITLE } from "@/lib/session-expired-evidence-copy";
import {
  SESSION_EXPIRED_PRIMARY_CONTENT_ID,
  SESSION_EXPIRED_SKIP_LINK_LABEL,
} from "@/lib/auth/session-expired-page-copy";

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

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: vi.fn(() => true),
  assertOidcSignInConfig: vi.fn(() => ({ ok: true as const })),
  getOidcAuthority: vi.fn(() => "https://login.example.com"),
  getOidcClientId: vi.fn(() => "test-client-id"),
  getOidcRedirectUri: vi.fn(() => "https://app.example.com/auth/callback"),
  getOidcScopes: vi.fn(() => "openid profile email"),
}));

import { SessionExpiredClient } from "@/app/(operator)/auth/session-expired/SessionExpiredClient";

describe("SessionExpiredClient buyer-polished shell", () => {
  beforeEach(() => {
    searchParamsMock.value = new URLSearchParams();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders skip link, recovery body, then orientation below the panel", () => {
    render(<SessionExpiredClient />);

    expect(screen.getByRole("link", { name: SESSION_EXPIRED_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SESSION_EXPIRED_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.queryByTestId("session-expired-breadcrumb")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: SESSION_EXPIRED_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const orientation = screen.getByTestId("session-expired-orientation-bottom");
    const sessionView = screen.getByTestId("session-expired-view");

    expect(orientation.compareDocumentPosition(sessionView) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
