import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InvitationAcceptPage, { metadata } from "@/app/(operator)/auth/invite/page";
import {
  AUTH_INVITE_PAGE_DESCRIPTION,
  AUTH_INVITE_PAGE_TITLE,
  AUTH_INVITE_SKIP_LINK_LABEL,
  AUTH_INVITE_SKIP_TARGET_ID,
} from "@/lib/auth/auth-invite-page-copy";

vi.mock("@/app/(operator)/auth/invite/InvitationAcceptPageClient", () => ({
  InvitationAcceptPageClient: () => {
    throw new Promise(() => {
      /* suspend so Suspense fallback renders */
    });
  },
}));

describe("InvitationAcceptPage (TB-1472)", () => {
  it("exports document metadata for the invitation accept auth step", () => {
    expect(metadata.title).toBe(AUTH_INVITE_PAGE_TITLE);
    expect(metadata.description).toBe(AUTH_INVITE_PAGE_DESCRIPTION);
  });

  it("wraps the client in Suspense with buyer chrome on the loading fallback", () => {
    render(<InvitationAcceptPage />);

    expect(screen.getByRole("link", { name: AUTH_INVITE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_INVITE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("auth-invite-primary-content")).toBeInTheDocument();
    expect(screen.getByTestId("auth-invite-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("auth-invite-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-accept-loading")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-accept-loading-skeleton-card")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-invite-breadcrumb")).not.toBeInTheDocument();
  });
});
