import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentAuthority, normalizeAuthMeResponse, type AuthMeResponse } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

describe("current-principal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("normalizes Admin role to AdminAuthority and enterprise surfacing", () => {
    const payload: AuthMeResponse = {
      name: "dev-admin",
      claims: [{ type: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role", value: "Admin" }],
    };
    const principal = normalizeAuthMeResponse(payload);

    expect(principal.provenance).toBe("auth-me");
    expect(principal.name).toBe("dev-admin");
    expect(principal.primaryAppRole).toBe("Admin");
    expect(principal.maxAuthority).toBe("AdminAuthority");
    expect(principal.authorityRank).toBe(AUTHORITY_RANK.AdminAuthority);
    expect(principal.hasEnterpriseOperatorSurfaces).toBe(true);
  });

  it("normalizes Reader to ReadAuthority without enterprise surfacing", () => {
    const principal = normalizeAuthMeResponse({
      claims: [{ type: "roles", value: "Reader" }],
    });

    expect(principal.primaryAppRole).toBe("Reader");
    expect(principal.maxAuthority).toBe("ReadAuthority");
    expect(principal.hasEnterpriseOperatorSurfaces).toBe(false);
  });

  it("maps Auditor at read rank to primaryAppRole Auditor", () => {
    const principal = normalizeAuthMeResponse({
      claims: [{ type: "roles", value: "Auditor" }],
    });

    expect(principal.primaryAppRole).toBe("Auditor");
    expect(principal.maxAuthority).toBe("ReadAuthority");
  });

  it("getCurrentAuthority returns maxAuthority from loadCurrentPrincipal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () =>
            Promise.resolve({
              name: "op",
              claims: [{ type: "roles", value: "Operator" }],
            } satisfies AuthMeResponse),
        } as Response),
      ),
    );

    const auth = await getCurrentAuthority({
      init: { headers: new Headers({ Accept: "application/json" }) },
    });

    expect(auth).toBe("ExecuteAuthority");
  });
});
