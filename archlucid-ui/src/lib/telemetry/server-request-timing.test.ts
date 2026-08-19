import { describe, expect, it } from "vitest";

import {
  applyServerTimingHeader,
  createServerTimingHeader,
  DEFAULT_PROXY_SLOW_MS,
  elapsedMsSince,
  resolveProxySlowThresholdMs,
  shouldLogSlowOrFailedRequest,
} from "@/lib/telemetry/server-request-timing";

describe("server-request-timing", () => {
  it("formats Server-Timing metrics", () => {
    expect(
      createServerTimingHeader([
        { name: "proxy", durationMs: 12.345 },
        { name: "upstream", durationMs: 10, description: "api" },
      ]),
    ).toBe('proxy;dur=12.35, upstream;dur=10;desc="api"');
  });

  it("applies and merges Server-Timing headers", () => {
    const headers = new Headers();
    applyServerTimingHeader(headers, [{ name: "proxy", durationMs: 5 }]);
    expect(headers.get("Server-Timing")).toBe("proxy;dur=5");

    applyServerTimingHeader(headers, [{ name: "upstream", durationMs: 3 }]);
    expect(headers.get("Server-Timing")).toBe("proxy;dur=5, upstream;dur=3");
  });

  it("resolves slow threshold and elapsed rounding", () => {
    expect(resolveProxySlowThresholdMs(undefined)).toBe(DEFAULT_PROXY_SLOW_MS);
    expect(resolveProxySlowThresholdMs("2500")).toBe(2500);
    expect(resolveProxySlowThresholdMs("nope")).toBe(DEFAULT_PROXY_SLOW_MS);
    expect(elapsedMsSince(100, 112.349)).toBe(12.35);
  });

  it("logs slow or failed requests only", () => {
    expect(shouldLogSlowOrFailedRequest(100, 200, 1000)).toBe(false);
    expect(shouldLogSlowOrFailedRequest(1000, 200, 1000)).toBe(true);
    expect(shouldLogSlowOrFailedRequest(10, 502, 1000)).toBe(true);
  });
});
