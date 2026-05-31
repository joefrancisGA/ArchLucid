import { describe, expect, it, afterEach, beforeEach } from "vitest";

import {
  isProxyClientScopeForwardingAllowed,
  resolveProxyUpstreamScopeHeaders,
} from "@/lib/proxy-scope-resolution";

describe("proxy-scope-resolution", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllow = process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS;
  const originalTrust = process.env.ARCHLUCID_PROXY_TRUST_SERVER_SCOPE_ONLY;
  const originalWorkspace = process.env.ARCHLUCID_PROXY_WORKSPACE_ID;
  const originalProject = process.env.ARCHLUCID_PROXY_PROJECT_ID;
  const originalTenant = process.env.ARCHLUCID_PROXY_TENANT_ID;

  beforeEach(() => {
    delete process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS;
    delete process.env.ARCHLUCID_PROXY_TRUST_SERVER_SCOPE_ONLY;
    delete process.env.ARCHLUCID_PROXY_TENANT_ID;
    delete process.env.ARCHLUCID_PROXY_WORKSPACE_ID;
    delete process.env.ARCHLUCID_PROXY_PROJECT_ID;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS = originalAllow;
    process.env.ARCHLUCID_PROXY_TRUST_SERVER_SCOPE_ONLY = originalTrust;
    process.env.ARCHLUCID_PROXY_TENANT_ID = originalTenant;
    process.env.ARCHLUCID_PROXY_WORKSPACE_ID = originalWorkspace;
    process.env.ARCHLUCID_PROXY_PROJECT_ID = originalProject;
  });

  it("forwards client scope in non-production by default", () => {
    process.env.NODE_ENV = "development";
    const headers = new Headers({
      "x-tenant-id": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      "x-workspace-id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      "x-project-id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    });

    const resolved = resolveProxyUpstreamScopeHeaders(headers);

    expect(resolved["x-tenant-id"]).toBe("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
  });

  it("ignores client scope in production unless explicitly allowed", () => {
    process.env.NODE_ENV = "production";
    process.env.ARCHLUCID_PROXY_TENANT_ID = "11111111-1111-1111-1111-111111111111";
    process.env.ARCHLUCID_PROXY_WORKSPACE_ID = "22222222-2222-2222-2222-222222222222";
    process.env.ARCHLUCID_PROXY_PROJECT_ID = "33333333-3333-3333-3333-333333333333";

    const headers = new Headers({
      "x-tenant-id": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      "x-workspace-id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      "x-project-id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    });

    const resolved = resolveProxyUpstreamScopeHeaders(headers);

    expect(resolved["x-tenant-id"]).toBe("11111111-1111-1111-1111-111111111111");
    expect(isProxyClientScopeForwardingAllowed()).toBe(false);
  });

  it("prefers bearer jwt scope over client headers in production", () => {
    process.env.NODE_ENV = "production";
    process.env.ARCHLUCID_PROXY_TENANT_ID = "11111111-1111-1111-1111-111111111111";

    const payload = Buffer.from(
      JSON.stringify({
        tenant_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        workspace_id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
        project_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      }),
      "utf8",
    ).toString("base64url");
    const token = `header.${payload}.sig`;

    const headers = new Headers({
      authorization: `Bearer ${token}`,
      "x-tenant-id": "99999999-9999-4999-8999-999999999999",
      "x-workspace-id": "88888888-8888-4888-8888-888888888888",
      "x-project-id": "77777777-7777-4777-8777-777777777777",
    });

    const resolved = resolveProxyUpstreamScopeHeaders(headers);

    expect(resolved["x-tenant-id"]).toBe("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
  });

  it("does not fall back to dev scope guids in production without trusted env", () => {
    process.env.NODE_ENV = "production";

    const headers = new Headers({
      "x-tenant-id": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      "x-workspace-id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      "x-project-id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    });

    const resolved = resolveProxyUpstreamScopeHeaders(headers);

    expect(resolved["x-tenant-id"]).toBeUndefined();
    expect(resolved["x-workspace-id"]).toBeUndefined();
    expect(resolved["x-project-id"]).toBeUndefined();
  });

  it("honors explicit dev escape hatch in production", () => {
    process.env.NODE_ENV = "production";
    process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS = "true";

    expect(isProxyClientScopeForwardingAllowed()).toBe(true);
  });
});
