import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthInviteEvidenceOrientationStrip } from "@/app/(operator)/auth/invite/AuthInviteEvidenceOrientationStrip";
import { AUTH_INVITE_CANONICAL_PATH, AUTH_INVITE_SOURCES } from "@/lib/auth-invite-evidence-copy";

describe("AuthInviteEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking auth invite", () => {
    render(<AuthInviteEvidenceOrientationStrip />);

    expect(screen.getByTestId("auth-invite-sources")).toBeInTheDocument();
    expect(screen.getByTestId("auth-invite-claim-discipline")).toBeInTheDocument();

    for (const link of AUTH_INVITE_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(AUTH_INVITE_SOURCES.some((link) => link.href === AUTH_INVITE_CANONICAL_PATH)).toBe(false);
  });
});
