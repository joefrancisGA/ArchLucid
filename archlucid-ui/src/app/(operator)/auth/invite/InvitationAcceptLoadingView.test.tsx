import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InvitationAcceptLoadingView } from "@/app/(operator)/auth/invite/InvitationAcceptLoadingView";
import {
  AUTH_INVITE_LOADING_DETAIL,
  AUTH_INVITE_PAGE_TITLE,
} from "@/lib/auth/auth-invite-page-copy";

describe("InvitationAcceptLoadingView (TB-1472)", () => {
  it("shows a status region with page title instead of bare prose-only loading", () => {
    render(<InvitationAcceptLoadingView />);

    expect(screen.getByRole("heading", { level: 1, name: AUTH_INVITE_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("invitation-accept-loading-status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(AUTH_INVITE_LOADING_DETAIL)).toBeInTheDocument();
  });
});

describe("InvitationAcceptLoadingView (TB-1473)", () => {
  it("shows structured skeleton placeholders for the invite summary card", () => {
    render(<InvitationAcceptLoadingView />);

    expect(screen.getByTestId("invitation-accept-loading-skeleton-card")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-accept-loading-lead-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-accept-loading")).toBeInTheDocument();
  });
});
