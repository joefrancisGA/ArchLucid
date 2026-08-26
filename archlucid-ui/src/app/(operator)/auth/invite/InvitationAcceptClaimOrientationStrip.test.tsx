import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AUTH_INVITE_FOLLOW_UPS_TITLE } from "@/lib/auth-invite-evidence-copy";
import { InvitationAcceptClaimOrientationStrip } from "./InvitationAcceptClaimOrientationStrip";

describe("InvitationAcceptClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<InvitationAcceptClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("auth-invite-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUTH_INVITE_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
