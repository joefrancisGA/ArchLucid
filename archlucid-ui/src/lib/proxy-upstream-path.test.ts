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

  it("rejects percent-encoded dot traversal segments", () => {
    expect(
      buildProxyUpstreamPath([
        "v1",
        "marketing",
        "quick-scan",
        "%2e%2e",
        "%2e%2e",
        "%2e%2e",
        "architecture",
        "draft",
        "draft-1",
      ]),
    ).toEqual({ ok: false });
  });

  it("rejects double-encoded dot traversal segments", () => {
    expect(
      buildProxyUpstreamPath([
        "v1",
        "marketing",
        "quick-scan",
        "%252e%252e",
        "%252e%252e",
        "architecture",
        "draft",
        "draft-1",
      ]),
    ).toEqual({ ok: false });
  });

  it("rejects deeply encoded dot traversal segments", () => {
    let encoded = "%2e%2e";

    for (let pass = 0; pass < 5; pass++) {
      encoded = encoded.replace(/%/g, "%25");
    }

    expect(
      buildProxyUpstreamPath([
        "v1",
        "marketing",
        "quick-scan",
        "status",
        encoded,
        encoded,
        encoded,
        "architecture",
        "draft",
        "draft-1",
      ]),
    ).toEqual({ ok: false });
  });
});
