import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OPERATOR_SCOPE_STORAGE_KEY } from "@/lib/operator/operator-scope-storage";

import { validateInvitationToken } from "@/lib/auth/invitation-validation-api";

describe("validateInvitationToken (pre-auth proxy)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: "Valid",
          allowEmailCode: true,
          requireEnterpriseSso: false,
        }),
      }),
    );
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("forwards stale operator scope headers on the anonymous validate GET", async () => {
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

    await validateInvitationToken("invite-token-value");

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);

    expect(headers.get("x-tenant-id")).toBe("11111111-1111-1111-1111-111111111111");
    expect(headers.get("x-workspace-id")).toBe("22222222-2222-2222-2222-222222222222");
    expect(headers.get("x-project-id")).toBe("33333333-3333-3333-3333-333333333333");
  });
});
