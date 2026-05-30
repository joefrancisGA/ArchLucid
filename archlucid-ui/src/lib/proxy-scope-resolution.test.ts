import { describe, expect, it, afterEach, beforeEach } from "vitest";

import {
  isProxyClientScopeForwardingAllowed,
  resolveProxyUpstreamScopeHeaders,
} from "@/lib/proxy-scope-resolution";

describe("proxy-scope-resolution", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllow = process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS;
  const originalTrust = process.env.ARCHLUCID_PROXY_TRUST_SERVER_SCOPE_ONLY;
  const originalTenant = process.env.ARCHLUCID_PROXY_TENANT_ID;

  beforeEach(() => {
    delete process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS;
    delete process.env.ARCHLUCID_PROXY_TRUST_SERVER_SCOPE_ONLY;
    delete process.env.ARCHLUCID_PROXY_TENANT_ID;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS = originalAllow;
    process.env.ARCHLUCID_PROXY_TRUST_SERVER_SCOPE_ONLY = originalTrust;
    process.env.ARCHLUCID_PROXY_TENANT_ID = originalTenant;
  });

  it("forwards client scope in non-production by default", () => {
    process.env.NODE_ENV = "development";
    const headers = new Headers({
      "x-tenant-id": "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      "x-workspace-id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      "x-project-id": "cccccccc-cccc-4ccc-cccc-cccccccccccc",
    });

    const resolved = resolveProxyUpstreamScopeHeaders(headers);

    expect(resolved["x-tenant-id"]).toBe("aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
  });

  it("ignores client scope in production unless explicitly allowed", () => {
    process.env.NODE_ENV = "production";
    process.env.ARCHLUCID_PROXY_TENANT_ID = "11111111-1111-1111-1111-111111111111";

    const headers = new Headers({
      "x-tenant-id": "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      "x-workspace-id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      "x-project-id": "cccccccc-cccc-4ccc-cccc-cccccccccccc",
    });

    const resolved = resolveProxyUpstreamScopeHeaders(headers);

    expect(resolved["x-tenant-id"]).toBe("11111111-1111-1111-1111-111111111111");
    expect(isProxyClientScopeForwardingAllowed()).toBe(false);
  });

  it("honors explicit dev escape hatch in production", () => {
    process.env.NODE_ENV = "production";
    process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS = "true";

    expect(isProxyClientScopeForwardingAllowed()).toBe(true);
  });
});
