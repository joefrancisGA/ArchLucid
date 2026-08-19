import { describe, expect, it } from "vitest";

import { readProxyScopeFromAuthorizationHeader } from "@/lib/proxy-bearer-scope";

function encodePayload(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, "utf8").toString("base64url");

  return `header.${b64}.sig`;
}

describe("proxy-bearer-scope", () => {
  it("returns scope headers when bearer jwt carries tenant triple claims", () => {
    const token = encodePayload({
      tenant_id: "11111111-1111-4111-8111-111111111111",
      workspace_id: "22222222-2222-4222-8222-222222222222",
      project_id: "33333333-3333-4333-8333-333333333333",
    });

    const scope = readProxyScopeFromAuthorizationHeader(`Bearer ${token}`);

    expect(scope).toEqual({
      "x-tenant-id": "11111111-1111-4111-8111-111111111111",
      "x-workspace-id": "22222222-2222-4222-8222-222222222222",
      "x-project-id": "33333333-3333-4333-8333-333333333333",
    });
  });

  it("returns null for missing or malformed authorization", () => {
    expect(readProxyScopeFromAuthorizationHeader(null)).toBeNull();
    expect(readProxyScopeFromAuthorizationHeader("ApiKey abc")).toBeNull();
    expect(readProxyScopeFromAuthorizationHeader("Bearer not-a-jwt")).toBeNull();
  });
});
