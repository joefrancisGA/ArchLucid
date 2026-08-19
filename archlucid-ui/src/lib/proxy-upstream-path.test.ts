import { describe, expect, it } from "vitest";

import { buildProxyUpstreamPath } from "@/lib/proxy-upstream-path";

describe("buildProxyUpstreamPath", () => {
  it("joins normal segments", () => {
    expect(buildProxyUpstreamPath(["v1", "marketing", "quick-scan", "status"])).toEqual({
      ok: true,
      path: "v1/marketing/quick-scan/status",
    });
  });

  it("rejects dot-segment traversal", () => {
    expect(
      buildProxyUpstreamPath([
        "v1",
        "marketing",
        "quick-scan",
        "status",
        "..",
        "..",
        "..",
        "architecture",
        "draft",
        "draft-1",
      ]),
    ).toEqual({ ok: false });
  });

  it("rejects empty segments", () => {
    expect(buildProxyUpstreamPath(["v1", "", "sample"])).toEqual({ ok: false });
  });
});
