import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InviteReviewerEvidenceOrientationStrip } from "@/app/(operator)/administration/users/_sections/InviteReviewerEvidenceOrientationStrip";
import {
  INVITE_REVIEWER_CANONICAL_PATH,
  INVITE_REVIEWER_CLAIM_DISCIPLINE,
  INVITE_REVIEWER_SOURCES,
  INVITE_REVIEWER_SOURCES_INTRO,
} from "@/lib/invite-reviewer-evidence-copy";

describe("InviteReviewerEvidenceOrientationStrip", () => {
  it("renders Sources and claim-discipline chrome", () => {
    render(<InviteReviewerEvidenceOrientationStrip />);

    expect(screen.getByTestId("invite-reviewer-sources")).toBeInTheDocument();
    expect(screen.getByTestId("invite-reviewer-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(INVITE_REVIEWER_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByText(INVITE_REVIEWER_CLAIM_DISCIPLINE)).toBeInTheDocument();

    for (const link of INVITE_REVIEWER_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(INVITE_REVIEWER_SOURCES.some((link) => link.href === INVITE_REVIEWER_CANONICAL_PATH)).toBe(false);
  });
});
