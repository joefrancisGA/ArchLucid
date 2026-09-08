import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SESSION_EXPIRED_CLAIM_DISCIPLINE,
  SESSION_EXPIRED_FOLLOW_UPS_TITLE,
  SESSION_EXPIRED_SOURCES,
} from "@/lib/session-expired-evidence-copy";
import {
  SESSION_EXPIRED_FIRST_VIEWPORT_ID,
  SESSION_EXPIRED_PRIMARY_CONTENT_ID,
  SESSION_EXPIRED_SKIP_LINK_LABEL,
  SESSION_EXPIRED_SKIP_TARGET_ID,
} from "@/lib/auth/session-expired-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

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

  it("renders skip link, orientation above recovery body, and Sources below the panel", () => {
    render(<SessionExpiredClient />);

    expect(screen.getByRole("link", { name: SESSION_EXPIRED_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SESSION_EXPIRED_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("session-expired-primary-content")).toHaveAttribute(
      "id",
      SESSION_EXPIRED_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("session-expired-breadcrumb")).toBeNull();

    const primaryContent = screen.getByTestId("session-expired-primary-content");
    const firstViewport = screen.getByTestId(SESSION_EXPIRED_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("session-expired-orientation-top");
    const sessionView = screen.getByTestId("session-expired-view");
    const orientationBottom = screen.getByTestId("session-expired-orientation-bottom");
    const sourcesSection = screen.getByTestId("session-expired-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(sessionView);
    expect(orientationTop.compareDocumentPosition(sessionView) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      orientationBottom.compareDocumentPosition(sessionView) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();

    expect(within(orientationTop).getByTestId("session-expired-claim-discipline").textContent).toContain(
      SESSION_EXPIRED_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: SESSION_EXPIRED_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(SESSION_EXPIRED_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
