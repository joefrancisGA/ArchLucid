import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InvitationAcceptPage, { metadata } from "@/app/(operator)/auth/invite/page";
import {
  AUTH_INVITE_PAGE_DESCRIPTION,
  AUTH_INVITE_PAGE_TITLE,
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

  it("wraps the client in Suspense with branded auth-flow loading chrome", () => {
    render(<InvitationAcceptPage />);

    expect(screen.getByTestId("auth-flow-shell")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-accept-loading")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-accept-loading-skeleton-card")).toBeInTheDocument();
  });
});
