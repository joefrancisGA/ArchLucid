import { describe, expect, it, vi } from "vitest";

import { requestPrincipalAppRoleAssignment } from "@/lib/admin-role-assignment-request";

describe("requestPrincipalAppRoleAssignment", () => {
  it("returns saved on 2xx", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 204 }));

    const result = await requestPrincipalAppRoleAssignment({ kind: "user", id: "u1" }, "Admin", fetchFn);

    expect(result).toBe("saved");
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/proxy/v1/admin/users/u1/role",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("returns preview when role endpoint is not implemented", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 404 }));

    const result = await requestPrincipalAppRoleAssignment({ kind: "api_key", id: "k1" }, "Operator", fetchFn);

    expect(result).toBe("preview");
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/proxy/v1/admin/api-keys/k1/role",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("returns failed on other HTTP errors", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 403 }));

    await expect(requestPrincipalAppRoleAssignment({ kind: "user", id: "u1" }, "Reader", fetchFn)).resolves.toBe(
      "failed",
    );
  });
});
