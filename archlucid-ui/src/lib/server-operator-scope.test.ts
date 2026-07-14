import { afterEach, describe, expect, it, vi } from "vitest";

import { shouldOmitDevDefaultScopeHeadersForServerUpstream } from "./server-operator-scope";

describe("shouldOmitDevDefaultScopeHeadersForServerUpstream", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true when server uses ApiKey without JWT bearer", () => {
    vi.stubEnv("ARCHLUCID_API_KEY", "e2e-admin-key-ci");
    vi.stubEnv("ARCHLUCID_PROXY_BEARER_TOKEN", "");

    expect(shouldOmitDevDefaultScopeHeadersForServerUpstream()).toBe(true);
  });

  it("returns false when JWT bearer is configured", () => {
    vi.stubEnv("ARCHLUCID_API_KEY", "e2e-admin-key-ci");
    vi.stubEnv("ARCHLUCID_PROXY_BEARER_TOKEN", "configured-proxy-bearer");

    expect(shouldOmitDevDefaultScopeHeadersForServerUpstream()).toBe(false);
  });

  it("returns false when no server ApiKey is configured", () => {
    vi.stubEnv("ARCHLUCID_API_KEY", "");
    vi.stubEnv("ARCHLUCID_PROXY_BEARER_TOKEN", "");

    expect(shouldOmitDevDefaultScopeHeadersForServerUpstream()).toBe(false);
  });
});
