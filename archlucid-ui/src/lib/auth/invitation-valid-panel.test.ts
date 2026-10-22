import { describe, expect, it } from "vitest";

import { resolveInvitationAppRolePresentation } from "@/lib/auth/invitation-valid-panel";

describe("invitation-valid-panel (TB-1475)", () => {
  it("maps built-in roles to buyer-safe labels", () => {
    expect(resolveInvitationAppRolePresentation("Operator")).toEqual({
      label: "Architect",
      claimCaption: "Claim value: Operator",
    });
    expect(resolveInvitationAppRolePresentation("Reader")).toEqual({
      label: "Reader",
      claimCaption: null,
    });
  });

  it("hides unknown appRole enum strings", () => {
    expect(resolveInvitationAppRolePresentation("WorkspaceContributor")).toBeNull();
    expect(resolveInvitationAppRolePresentation("")).toBeNull();
    expect(resolveInvitationAppRolePresentation(null)).toBeNull();
  });
});
