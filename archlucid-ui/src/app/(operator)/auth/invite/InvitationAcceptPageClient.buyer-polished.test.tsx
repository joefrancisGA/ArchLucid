import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_INVITE_CLAIM_DISCIPLINE_HEADING,
  AUTH_INVITE_FOLLOW_UPS_TITLE,
} from "@/lib/auth-invite-evidence-copy";
import {
  AUTH_INVITE_PRIMARY_CONTENT_ID,
  AUTH_INVITE_SKIP_LINK_LABEL,
} from "@/lib/auth/auth-invite-page-copy";

const validateInvitationToken = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
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

  it("renders skip link, breadcrumb, orientation above body, and hides vocabulary rail", async () => {
    render(<InvitationAcceptPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("invitation-valid-panel")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: AUTH_INVITE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_INVITE_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("auth-invite-breadcrumb")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: AUTH_INVITE_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUTH_INVITE_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("cold-invite-users-invite-vocabulary")).toBeNull();

    const orientation = screen.getByTestId("auth-invite-orientation-top");
    const acceptPage = screen.getByTestId("invitation-accept-page");

    expect(screen.getByTestId("auth-invite-primary-content")).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(acceptPage) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });
});
