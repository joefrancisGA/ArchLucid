import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AUTH_INVITE_CLAIM_DISCIPLINE,
  AUTH_INVITE_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/auth-invite-evidence-copy";

import { InvitationAcceptClaimOrientationStrip } from "./InvitationAcceptClaimOrientationStrip";

describe("InvitationAcceptClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<InvitationAcceptClaimOrientationStrip />);

    expect(
      screen.getByRole("heading", { level: 2, name: AUTH_INVITE_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("auth-invite-claim-discipline").textContent).toContain(
      AUTH_INVITE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("auth-invite-sources")).toBeInTheDocument();
  });
});
