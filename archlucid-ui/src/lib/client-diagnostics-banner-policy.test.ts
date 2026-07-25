import { afterEach, describe, expect, it, vi } from "vitest";

describe("client-diagnostics-banner-policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to enabled", async () => {
    const { isClientDiagnosticsBannerEnabled } = await import("@/lib/client-diagnostics-banner-policy");

    expect(isClientDiagnosticsBannerEnabled()).toBe(true);
  });

  it("disables when NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER=0", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER", "0");
    const { isClientDiagnosticsBannerEnabled } = await import("@/lib/client-diagnostics-banner-policy");

    expect(isClientDiagnosticsBannerEnabled()).toBe(false);
  });
});
