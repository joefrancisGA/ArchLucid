import { describe, expect, it } from "vitest";

import {
  formatAccessDeniedSupportTimestamp,
  operatorPrincipalLacksArchLucidAccess,
  resolveAccessDeniedSupplementMessage,
} from "@/lib/access-denied-context";
import type { CurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

function principal(overrides: Partial<CurrentPrincipal>): CurrentPrincipal {
  return {
    provenance: "auth-me",
    name: "ops@example.com",
    roleClaimValues: [],
    primaryAppRole: null,
    maxAuthority: "ReadAuthority",
    authorityRank: AUTHORITY_RANK.ReadAuthority,
    hasEnterpriseOperatorSurfaces: false,
    hasCommittedArchitectureReview: false,
    hasRecognizedArchLucidRole: false,
    permissionClaimValues: [],
    ...overrides,
  };
}

describe("operatorPrincipalLacksArchLucidAccess", () => {
  it("returns true for auth-me principals without a recognized ArchLucid role", () => {
    expect(
      operatorPrincipalLacksArchLucidAccess(principal({ hasRecognizedArchLucidRole: false }), {
        jwtSignedIn: true,
      }),
    ).toBe(true);
  });

  it("returns false when a recognized ArchLucid role is present", () => {
    expect(
      operatorPrincipalLacksArchLucidAccess(
        principal({ hasRecognizedArchLucidRole: true, roleClaimValues: ["Reader"] }),
        { jwtSignedIn: true },
      ),
    ).toBe(false);
  });

  it("returns true when /me failed for a signed-in JWT session", () => {
    expect(
      operatorPrincipalLacksArchLucidAccess(
        principal({
          provenance: "synthetic",
          syntheticReason: "me-http",
          hasRecognizedArchLucidRole: false,
        }),
        { jwtSignedIn: true },
      ),
    ).toBe(true);
  });
});

describe("resolveAccessDeniedSupplementMessage", () => {
  it("prefers missing-role copy for auth-me principals without roles", () => {
    expect(
      resolveAccessDeniedSupplementMessage(principal({ hasRecognizedArchLucidRole: false }), {
        jwtSignedIn: true,
      }),
    ).toBe("missing-role");
  });

  it("uses wrong-tenant copy when /me is forbidden for a signed-in session", () => {
    expect(
      resolveAccessDeniedSupplementMessage(
        principal({
          provenance: "synthetic",
          syntheticReason: "me-http",
        }),
        { jwtSignedIn: true },
      ),
    ).toBe("wrong-tenant");
  });
});

describe("formatAccessDeniedSupportTimestamp", () => {
  it("formats a stable date/time with timezone label", () => {
    const formatted = formatAccessDeniedSupportTimestamp(new Date("2026-07-06T22:42:00.000Z"), "America/New_York");

    expect(formatted).toContain("2026-07-06");
    expect(formatted).toContain("18:42");
    expect(formatted).toMatch(/EDT|EST/);
  });
});
