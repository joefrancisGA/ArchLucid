import { describe, expect, it } from "vitest";

import {
  AUTH_INVITE_PATH,
  COLD_INVITE_USERS_INVITE_COLD_LINK,
  COLD_INVITE_USERS_INVITE_COMPACT_LINE,
  COLD_INVITE_USERS_INVITE_HEADING,
  COLD_INVITE_USERS_INVITE_USERS_LINK,
  COLD_INVITE_USERS_INVITE_WHY_TWO,
  buildColdInviteUsersInviteVocabulary,
  resolveColdInviteUsersInvitePeerLink,
} from "@/lib/cold-invite-users-invite-vocabulary";
import { INVITE_REVIEWER_PATH } from "@/lib/invite-reviewer-flow";

describe("cold-invite-users-invite-vocabulary (TB-2276)", () => {
  it("explains cold accept vs admin send invite", () => {
    const model = buildColdInviteUsersInviteVocabulary();

    expect(model.heading).toBe(COLD_INVITE_USERS_INVITE_HEADING);
    expect(model.heading.toLowerCase()).toContain("invitation");
    expect(model.whyTwo).toBe(COLD_INVITE_USERS_INVITE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("accept");
    expect(model.whyTwo.toLowerCase()).toContain("invite");
    expect(model.whyTwo.toLowerCase()).toContain("reviewer");
    expect(model.compactLine).toBe(COLD_INVITE_USERS_INVITE_COMPACT_LINE);

    expect(model.coldInviteLink).toEqual(COLD_INVITE_USERS_INVITE_COLD_LINK);
    expect(model.coldInviteLink.href).toBe(AUTH_INVITE_PATH);
    expect(model.coldInviteLink.href).toBe("/auth/invite");

    expect(model.usersInviteLink).toEqual(COLD_INVITE_USERS_INVITE_USERS_LINK);
    expect(model.usersInviteLink.href).toBe(INVITE_REVIEWER_PATH);
    expect(model.usersInviteLink.href).toBe("/administration/users/invite-reviewer");
  });

  it("resolves the peer surface from cold-invite and users-invite", () => {
    expect(resolveColdInviteUsersInvitePeerLink("cold-invite")).toEqual(
      COLD_INVITE_USERS_INVITE_USERS_LINK,
    );
    expect(resolveColdInviteUsersInvitePeerLink("users-invite")).toEqual(
      COLD_INVITE_USERS_INVITE_COLD_LINK,
    );
  });
});
