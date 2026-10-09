import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LIVE_E2E_PROXY_RATE_LIMIT_PER_MINUTE_DEFAULT,
  resolveLiveE2eProxyRateLimitPerMinute,
} from "./live-e2e-proxy-rate-limit";

describe("resolveLiveE2eProxyRateLimitPerMinute", () => {
  it("uses the explicit env value when set", () => {
    expect(
      resolveLiveE2eProxyRateLimitPerMinute({
        ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE: " 4000 ",
      }),
    ).toBe("4000");
  });

  it("keeps a finite live-e2e burst cap when env is unset", () => {
    expect(resolveLiveE2eProxyRateLimitPerMinute({})).toBe(
      LIVE_E2E_PROXY_RATE_LIMIT_PER_MINUTE_DEFAULT,
    );
    expect(Number(LIVE_E2E_PROXY_RATE_LIMIT_PER_MINUTE_DEFAULT)).toBeGreaterThan(120);
  });

  it("treats blank env as unset so the burst cap still applies", () => {
    expect(
      resolveLiveE2eProxyRateLimitPerMinute({
        ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE: "   ",
      }),
    ).toBe(LIVE_E2E_PROXY_RATE_LIMIT_PER_MINUTE_DEFAULT);
  });

  it("live Playwright starter applies the resolved proxy burst cap", () => {
    const starter = readFileSync(join(__dirname, "../start-e2e-live-api.ts"), "utf8");

    expect(starter).toContain("resolveLiveE2eProxyRateLimitPerMinute");
    expect(starter).toContain("ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE");
  });

  it("mock Playwright starter applies the same finite proxy burst cap", () => {
    const starter = readFileSync(join(__dirname, "../start-e2e-with-mock.ts"), "utf8");

    expect(starter).toContain("resolveLiveE2eProxyRateLimitPerMinute");
    expect(starter).toContain("ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE");
  });
});
