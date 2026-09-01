import { describe, expect, it } from "vitest";

import { canArchiveReview } from "@/lib/review-archive-eligibility";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const ownership = {
  callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
  allowCreatorDeleteOwnedWork: true,
  callerPrincipal: {
    name: "jordan@example.com",
    meClaims: [{ type: "email", value: "jordan@example.com" }],
  },
} as const;

describe("review-archive-eligibility", () => {
  it("allows archive for in-flight reviews owned by the caller", () => {
    expect(
      canArchiveReview(
        {
          runId: "run-1",
          hasGoldenManifest: false,
          isArchived: false,
          createdByUserId: "jordan@example.com",
        },
        ownership,
      ),
    ).toBe(true);
  });

  it("blocks archive for sealed reviews", () => {
    expect(
      canArchiveReview(
        {
          runId: "run-1",
          hasGoldenManifest: true,
          isArchived: false,
          createdByUserId: "jordan@example.com",
        },
        ownership,
      ),
    ).toBe(false);
  });

  it("blocks archive when already archived", () => {
    expect(
      canArchiveReview(
        {
          runId: "run-1",
          hasGoldenManifest: false,
          isArchived: true,
          createdByUserId: "jordan@example.com",
        },
        ownership,
      ),
    ).toBe(false);
  });
});
