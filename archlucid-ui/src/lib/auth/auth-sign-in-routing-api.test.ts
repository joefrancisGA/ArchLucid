import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { evaluateAuthSignInRouting } from "@/lib/auth/auth-sign-in-routing-api";
import { OPERATOR_SCOPE_STORAGE_KEY } from "@/lib/operator/operator-scope-storage";

describe("evaluateAuthSignInRouting (pre-auth proxy)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          allowEmailCode: true,
          ssoRequired: false,
        }),
      }),
    );
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("does not attach browser proxy scope headers on the pre-auth routing evaluate POST", async () => {
    localStorage.setItem(
      OPERATOR_SCOPE_STORAGE_KEY,
      JSON.stringify({
        tenantId: "11111111-1111-1111-1111-111111111111",
        workspaceId: "22222222-2222-2222-2222-222222222222",
        projectId: "33333333-3333-3333-3333-333333333333",
        workspaceLabel: "w",
        projectLabel: "p",
      }),
    );

    await evaluateAuthSignInRouting("operator@example.com", null, "/reviews");

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);

    expect(headers.get("x-tenant-id")).toBeNull();
    expect(headers.get("x-workspace-id")).toBeNull();
    expect(headers.get("x-project-id")).toBeNull();
  });

  it("returns null when the proxy responds with 401 (same shape as network failure)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    const result = await evaluateAuthSignInRouting("operator@example.com", null, "/reviews");

    expect(result).toBeNull();
  });

  it("returns null when the proxy responds with 403 (same shape as network failure)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 403 }));

    const result = await evaluateAuthSignInRouting("operator@example.com", "invite-token", "/reviews");

    expect(result).toBeNull();
  });
});
