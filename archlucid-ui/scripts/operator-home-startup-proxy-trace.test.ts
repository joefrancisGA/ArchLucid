import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_BASELINE_RELATIVE_PATH,
  compareOperatorHomeProxyTrace,
  countNormalizedProxyPaths,
  countShellStatusHydratedRequests,
  normalizeProxyApiPath,
  readBaseline,
  readTraceCapture,
} from "./operator-home-startup-proxy-trace.mjs";

const PASS_FIXTURE = join(
  process.cwd(),
  "scripts",
  "fixtures",
  "operator-home-startup-proxy-trace.pass.v1.json",
);

describe("operator-home-startup-proxy-trace (TB-2304 performance)", () => {
  it("normalizes UI proxy paths to OpenAPI-relative paths", () => {
    expect(normalizeProxyApiPath("/api/proxy/v1/operator/shell-status")).toBe(
      "/v1/operator/shell-status",
    );
    expect(normalizeProxyApiPath("/api/proxy/health/ready")).toBe("/health/ready");
    expect(normalizeProxyApiPath("/v1/user/preferences")).toBe("/v1/user/preferences");
  });

  it("passes the committed pass fixture against the baseline budget", () => {
    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));
    const capture = readTraceCapture(PASS_FIXTURE);
    const result = compareOperatorHomeProxyTrace(capture.entries, baseline);

    expect(result.ok).toBe(true);
    expect(result.messages.some((message) => message.startsWith("FAIL:"))).toBe(false);
  });

  it("flags duplicate shell-status hydrated GETs", () => {
    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));
    const entries = [
      { path: "/api/proxy/v1/operator/shell-status", method: "GET" },
      { path: "/api/proxy/v1/tenant/trial-status", method: "GET" },
    ];
    const hydratedCount = countShellStatusHydratedRequests(entries, baseline.shellStatusHydratedPaths);

    expect(hydratedCount).toBe(1);

    const result = compareOperatorHomeProxyTrace(entries, baseline);

    expect(result.ok).toBe(false);
    expect(result.messages.some((message) => message.includes("hydrated duplicate"))).toBe(true);
  });

  it("flags excess user/preferences duplicates", () => {
    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));
    const entries = [
      { path: "/v1/operator/shell-status", method: "GET" },
      { path: "/v1/user/preferences", method: "GET" },
      { path: "/v1/user/preferences", method: "GET" },
    ];
    const counts = countNormalizedProxyPaths(entries);

    expect(counts.get("/v1/user/preferences")).toBe(2);

    const result = compareOperatorHomeProxyTrace(entries, baseline);

    expect(result.ok).toBe(false);
    expect(result.messages.some((message) => message.includes("/v1/user/preferences"))).toBe(true);
  });

  it("documents TB-2302 go/no-go on the committed baseline", () => {
    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));
    const raw = readFileSync(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH), "utf8");

    expect(baseline.tb2302BootstrapBundlingGoNoGo).toBe("no-go");
    expect(raw).toContain("TB-2302");
  });
});
