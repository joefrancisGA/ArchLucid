import { describe, expect, it } from "vitest";

import { INVITE_REVIEWER_PAGE_LEAD } from "@/lib/invite-reviewer-flow";

import {
  INVITE_REVIEWER_CLAIM_HEADING,
  INVITE_REVIEWER_PAGE_SUBTITLE_BUYER,
  inviteReviewerPageSubtitle,
} from "./invite-reviewer-page-copy";

describe("invite-reviewer-page-copy buyer page chrome", () => {
  it("uses buyer subtitle only in polished shell", () => {
    expect(inviteReviewerPageSubtitle(true)).toBe(INVITE_REVIEWER_PAGE_SUBTITLE_BUYER);
    expect(inviteReviewerPageSubtitle(false)).toBe(INVITE_REVIEWER_PAGE_LEAD);
  });

  it("keeps claim heading invitation-first", () => {
    expect(INVITE_REVIEWER_CLAIM_HEADING.toLowerCase()).toContain("invitation");
  });
});
