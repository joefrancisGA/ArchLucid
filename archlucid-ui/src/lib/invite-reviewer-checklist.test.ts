import { describe, expect, it } from "vitest";

import {
  resolveInviteReviewerEmphasizedStepId,
  resolveInviteReviewerSteps,
} from "@/lib/invite-reviewer-checklist";

describe("resolveInviteReviewerSteps", () => {
  it("emphasizes email before role", () => {
    expect(
      resolveInviteReviewerEmphasizedStepId({
        emailConfigured: false,
        roleSelected: false,
        inviteSent: false,
      }),
    ).toBe("email");

    expect(
      resolveInviteReviewerSteps({
        emailConfigured: true,
        roleSelected: false,
        inviteSent: false,
      }).find((step) => step.id === "role")?.complete,
    ).toBe(false);
  });
});
