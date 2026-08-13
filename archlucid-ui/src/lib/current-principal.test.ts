import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  invalidateCurrentPrincipalCache,
  loadCurrentPrincipal,
  normalizeAuthMeResponse,
} from "@/lib/current-principal";
import { operateCapabilityFromRank } from "@/lib/operate-capability";
import { AUTHORITY_RANK, requiredAuthorityFromRank } from "@/lib/nav-authority";

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => false,
}));

vi.mock("@/lib/oidc/session", () => ({
  ensureAccessTokenFresh: vi.fn(async () => undefined),
  getAccessTokenForApi: () => "test-token",
  isLikelySignedIn: () => true,
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/dev-testing-overrides", () => ({
  applyDevRoleOverrideToPrincipal: <T,>(principal: T) => principal,
  readDevRoleOverrideFromDocument: () => null,
  DEV_TEST_ACTOR_ROLE_HEADER: "x-dev-test-actor-role",
}));

/** Guards the `/me` → `CurrentPrincipal` seam used by `OperatorNavAuthorityProvider` (rank + enterprise surfacing flag). */
describe("normalizeAuthMeResponse", () => {
  it("collects permission claims from /me", () => {
    const principal = normalizeAuthMeResponse({
      claims: [
        { type: "roles", value: "Operator" },
        { type: "permission", value: "export:consulting-docx" },
        { type: "permission", value: "commit:run" },
      ],
    });

    expect(principal.permissionClaimValues).toEqual(["export:consulting-docx", "commit:run"]);
    expect(principal.authorityRank).toBe(AUTHORITY_RANK.ExecuteAuthority);
  });

  it("maps Operator role to Execute rank and enables enterprise operator surfacing", () => {
    const principal = normalizeAuthMeResponse({
      name: "ops",
      claims: [{ type: "roles", value: "Operator" }],
    });

    expect(principal.provenance).toBe("auth-me");
    expect(principal.authorityRank).toBe(AUTHORITY_RANK.ExecuteAuthority);
    expect(principal.maxAuthority).toBe("ExecuteAuthority");
    expect(principal.primaryAppRole).toBe("Operator");
    expect(principal.hasEnterpriseOperatorSurfaces).toBe(true);
    expect(principal.roleClaimValues).toEqual(["Operator"]);
  });

  it("maps Reader to Read rank without enterprise operator surfacing", () => {
    const principal = normalizeAuthMeResponse({
      claims: [{ type: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role", value: "Reader" }],
    });

    expect(principal.authorityRank).toBe(AUTHORITY_RANK.ReadAuthority);
    expect(principal.maxAuthority).toBe("ReadAuthority");
    expect(principal.hasEnterpriseOperatorSurfaces).toBe(false);
    expect(principal.primaryAppRole).toBe("Reader");
  });

  it("maps Auditor to Read rank but preserves Auditor as primaryAppRole", () => {
    const principal = normalizeAuthMeResponse({
      claims: [{ type: "roles", value: "Auditor" }],
    });

    expect(principal.authorityRank).toBe(AUTHORITY_RANK.ReadAuthority);
    expect(principal.primaryAppRole).toBe("Auditor");
    expect(principal.hasEnterpriseOperatorSurfaces).toBe(false);
    expect(principal.hasRecognizedArchLucidRole).toBe(true);
  });

  it("marks hasRecognizedArchLucidRole false when /me has no ArchLucid app roles", () => {
    const principal = normalizeAuthMeResponse({ claims: [{ type: "sub", value: "user-1" }] });

    expect(principal.hasRecognizedArchLucidRole).toBe(false);
    expect(principal.authorityRank).toBe(0);
  });

  it("picks Admin when multiple role claims are present", () => {
    const principal = normalizeAuthMeResponse({
      claims: [
        { type: "roles", value: "Reader" },
        { type: "roles", value: "Admin" },
      ],
    });

    expect(principal.authorityRank).toBe(AUTHORITY_RANK.AdminAuthority);
    expect(principal.maxAuthority).toBe("AdminAuthority");
    expect(principal.hasEnterpriseOperatorSurfaces).toBe(true);
    expect(principal.primaryAppRole).toBe("Admin");
  });

  it("maps hasCommittedArchitectureReview only when strictly true", () => {
    expect(normalizeAuthMeResponse({ claims: [] }).hasCommittedArchitectureReview).toBe(false);
    expect(
      normalizeAuthMeResponse({
        claims: [],
        hasCommittedArchitectureReview: true,
      }).hasCommittedArchitectureReview,
    ).toBe(true);
    expect(
      normalizeAuthMeResponse({
        claims: [],
        hasCommittedArchitectureReview: false,
      }).hasCommittedArchitectureReview,
    ).toBe(false);
  });

  /**
   * `hasEnterpriseOperatorSurfaces` and `useOperateCapability` must stay on the same Execute floor;
   * diverging formulas would mis-label principals or soft-enable writes inconsistently.
   */
  /**
   * `CurrentPrincipal.maxAuthority` must stay the string tier for `authorityRank` — otherwise nav labels and
   * diagnostics drift from `nav-authority.requiredAuthorityFromRank`.
   */
  it("maps maxAuthority to requiredAuthorityFromRank(authorityRank) for representative /me payloads", () => {
    const payloads = [
      { claims: [{ type: "roles", value: "Reader" }] },
      { claims: [{ type: "roles", value: "Operator" }] },
      { claims: [{ type: "roles", value: "Admin" }] },
      { claims: [] as { type: string; value: string }[] },
    ];

    for (const body of payloads) {
      const principal = normalizeAuthMeResponse(body);

      expect(principal.maxAuthority).toBe(requiredAuthorityFromRank(principal.authorityRank));
    }
  });

  it("keeps hasEnterpriseOperatorSurfaces aligned with operateCapabilityFromRank for /me-shaped payloads", () => {
    const payloads = [
      { claims: [{ type: "roles", value: "Reader" }] },
      { claims: [{ type: "roles", value: "Auditor" }] },
      {
        claims: [
          {
            type: "https://login.microsoftonline.com/tenant/v2.0/claims/role",
            value: "Operator",
          },
        ],
      },
      { claims: [{ type: "roles", value: "Operator" }] },
      { claims: [{ type: "roles", value: "Admin" }] },
      { claims: [] as { type: string; value: string }[] },
    ];

    for (const body of payloads) {
      const principal = normalizeAuthMeResponse(body);

      expect(principal.hasEnterpriseOperatorSurfaces).toBe(
        operateCapabilityFromRank(principal.authorityRank),
      );
    }
  });
});

describe("loadCurrentPrincipal", () => {
  const authMeBody = {
    name: "ops",
    claims: [{ type: "roles", value: "Operator" }],
  };

  beforeEach(() => {
    invalidateCurrentPrincipalCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    invalidateCurrentPrincipalCache();
  });

  it("coalesces parallel callers into one network fetch", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(authMeBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([loadCurrentPrincipal(), loadCurrentPrincipal()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.provenance).toBe("auth-me");
    expect(second.authorityRank).toBe(first.authorityRank);
  });

  it("returns cached auth-me principal without a second fetch within TTL", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(authMeBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await loadCurrentPrincipal();
    await loadCurrentPrincipal();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bypasses cache when bypassCache is true", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(authMeBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await loadCurrentPrincipal();
    await loadCurrentPrincipal({ bypassCache: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
