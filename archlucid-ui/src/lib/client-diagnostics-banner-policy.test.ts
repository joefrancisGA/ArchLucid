import { afterEach, describe, expect, it, vi } from "vitest";

describe("client-diagnostics-banner-policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to disabled", async () => {
    const { isClientDiagnosticsBannerEnabled } = await import("@/lib/client-diagnostics-banner-policy");

    expect(isClientDiagnosticsBannerEnabled()).toBe(false);
  });

  it("enables when NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER=1", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER", "1");
    const { isClientDiagnosticsBannerEnabled } = await import("@/lib/client-diagnostics-banner-policy");

    expect(isClientDiagnosticsBannerEnabled()).toBe(true);
  });

  it("enables when NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER=true", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER", "true");
    const { isClientDiagnosticsBannerEnabled } = await import("@/lib/client-diagnostics-banner-policy");

    expect(isClientDiagnosticsBannerEnabled()).toBe(true);
  });
});
