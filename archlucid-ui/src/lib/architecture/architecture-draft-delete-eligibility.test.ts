import { describe, expect, it } from "vitest";

import { canDeleteArchitectureDraft } from "@/lib/architecture/architecture-draft-delete-eligibility";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const ownership = {
  callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
  allowCreatorDeleteOwnedWork: true,
  callerPrincipal: {
    name: "jordan@example.com",
    meClaims: [{ type: "email", value: "jordan@example.com" }],
  },
} as const;

describe("architecture-draft-delete-eligibility", () => {
  it("allows delete when there is no linked review and server status is drafting", () => {
    expect(
      canDeleteArchitectureDraft({
        linkedReviewId: null,
        serverStatus: "Drafting",
        createdByUserId: "jordan@example.com",
        ...ownership,
      }),
    ).toBe(true);
  });

  it("blocks delete when a review is linked", () => {
    expect(
      canDeleteArchitectureDraft({
        linkedReviewId: "run-1",
        serverStatus: "Drafting",
        createdByUserId: "jordan@example.com",
        ...ownership,
      }),
    ).toBe(false);
  });

  it("blocks delete after a review has been spawned", () => {
    expect(
      canDeleteArchitectureDraft({
        linkedReviewId: null,
        serverStatus: "RunSpawned",
        createdByUserId: "jordan@example.com",
        ...ownership,
      }),
    ).toBe(false);
  });
});
