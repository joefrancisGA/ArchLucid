import { describe, expect, it } from "vitest";

import {
  formatProxyUpstreamUnreachableDetail,
  isProxyUpstreamTimeoutFailure,
} from "./proxy-upstream-unreachable-detail";

describe("isProxyUpstreamTimeoutFailure", () => {
  it("matches AbortSignal.timeout wording", () => {
    expect(isProxyUpstreamTimeoutFailure("The operation was aborted due to timeout")).toBe(true);
  });

  it("rejects plain connection failures", () => {
    expect(isProxyUpstreamTimeoutFailure("fetch failed")).toBe(false);
  });
});

describe("formatProxyUpstreamUnreachableDetail", () => {
  it("names method, path, and budget on timeout", () => {
    const detail = formatProxyUpstreamUnreachableDetail({
      method: "POST",
      path: "v1/architecture/request",
      timeoutMs: 60_000,
      causeMessage: "The operation was aborted due to timeout",
    });

    expect(detail).toContain("POST /v1/architecture/request timed out after 60s");
    expect(detail).toContain("budget 60000ms");
    expect(detail).toContain("The operation was aborted due to timeout");
  });

  it("still includes method and path for non-timeout transport failures", () => {
    const detail = formatProxyUpstreamUnreachableDetail({
      method: "GET",
      path: "v1/architecture/runs",
      timeoutMs: 60_000,
      causeMessage: "fetch failed",
    });

    expect(detail).toContain("GET /v1/architecture/runs failed");
    expect(detail).toContain("fetch failed");
  });
});
