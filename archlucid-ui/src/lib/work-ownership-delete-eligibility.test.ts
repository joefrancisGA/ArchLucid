import { describe, expect, it } from "vitest";

import type { CurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { canDeleteOwnedWork } from "@/lib/work-ownership-delete-eligibility";

const creatorPrincipal: Pick<CurrentPrincipal, "name" | "meClaims"> = {
  name: "jordan@example.com",
  meClaims: [{ type: "oid", value: "actor-guid-123" }],
};

describe("canDeleteOwnedWork", () => {
  it("allows workspace administrators regardless of ownership", () => {
    expect(
      canDeleteOwnedWork({
        createdByUserId: "someone-else",
        callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
        allowCreatorDeleteOwnedWork: false,
      }),
    ).toBe(true);
  });

  it("allows any execute operator when creator is unknown (legacy rows)", () => {
    expect(
      canDeleteOwnedWork({
        createdByUserId: null,
        callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
        allowCreatorDeleteOwnedWork: true,
        callerPrincipal: creatorPrincipal,
      }),
    ).toBe(true);
  });

  it("blocks non-admin non-creators when creator delete is enabled", () => {
    expect(
      canDeleteOwnedWork({
        createdByUserId: "other@example.com",
        callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
        allowCreatorDeleteOwnedWork: true,
        callerPrincipal: creatorPrincipal,
      }),
    ).toBe(false);
  });

  it("allows the creator when creator delete is enabled", () => {
    expect(
      canDeleteOwnedWork({
        createdByUserId: "jordan@example.com",
        callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
        allowCreatorDeleteOwnedWork: true,
        callerPrincipal: creatorPrincipal,
      }),
    ).toBe(true);
  });

  it("blocks creators when tenant policy disables creator delete", () => {
    expect(
      canDeleteOwnedWork({
        createdByUserId: "jordan@example.com",
        callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
        allowCreatorDeleteOwnedWork: false,
        callerPrincipal: creatorPrincipal,
      }),
    ).toBe(false);
  });
});
