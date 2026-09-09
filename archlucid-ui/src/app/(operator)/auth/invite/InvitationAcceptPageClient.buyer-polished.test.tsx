import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_INVITE_CLAIM_DISCIPLINE,
  AUTH_INVITE_FOLLOW_UPS_TITLE,
  AUTH_INVITE_SOURCES,
} from "@/lib/auth-invite-evidence-copy";
import {
  AUTH_INVITE_FIRST_VIEWPORT_ID,
  AUTH_INVITE_PRIMARY_CONTENT_ID,
  AUTH_INVITE_SKIP_LINK_LABEL,
  AUTH_INVITE_SKIP_TARGET_ID,
} from "@/lib/auth/auth-invite-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

const validateInvitationToken = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth/invitation-validation-api", () => ({
  validateInvitationToken: (...args: unknown[]) => validateInvitationToken(...args),
}));

vi.mock("@/lib/auth/email-otp-session", () => ({
  storeInvitationToken: vi.fn(),
  clearInvitationToken: vi.fn(),
}));

import { useSearchParams } from "next/navigation";

import { InvitationAcceptPageClient } from "@/app/(operator)/auth/invite/InvitationAcceptPageClient";

describe("InvitationAcceptPageClient buyer-polished shell", () => {
  beforeEach(() => {
    validateInvitationToken.mockReset();
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("token=invite-token") as ReturnType<typeof useSearchParams>,
    );
    validateInvitationToken.mockResolvedValue({
      status: "Valid",
      allowEmailCode: true,
      requireEnterpriseSso: false,
      maskedInvitedEmail: "o***@example.com",
      appRole: "Reader",
    });
  });

  it("renders skip link, orientation above invite body, and Sources below the panel", async () => {
    render(<InvitationAcceptPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("invitation-valid-panel")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: AUTH_INVITE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_INVITE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("auth-invite-primary-content")).toHaveAttribute(
      "id",
      AUTH_INVITE_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("auth-invite-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("cold-invite-users-invite-vocabulary")).toBeNull();

    const primaryContent = screen.getByTestId("auth-invite-primary-content");
    const firstViewport = screen.getByTestId(AUTH_INVITE_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("auth-invite-orientation-top");
    const acceptPage = screen.getByTestId("invitation-accept-page");
    const orientationBottom = screen.getByTestId("auth-invite-orientation-bottom");
    const sourcesSection = screen.getByTestId("auth-invite-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(acceptPage);
    expect(orientationTop.compareDocumentPosition(acceptPage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      orientationBottom.compareDocumentPosition(acceptPage) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();

    expect(within(orientationTop).getByTestId("auth-invite-claim-discipline").textContent).toContain(
      AUTH_INVITE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: AUTH_INVITE_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(AUTH_INVITE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
