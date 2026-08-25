import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { isSafeReturnPath, resolveSafeReturnPath } from "@/lib/navigation/safe-return-path";

describe("isSafeReturnPath", () => {
  it("accepts a simple local path", () => {
    expect(isSafeReturnPath("/architecture/reviews/123")).toBe(true);
  });

  it("accepts the root path", () => {
    expect(isSafeReturnPath("/")).toBe(true);
  });

  it("accepts a local path with a query string", () => {
    expect(isSafeReturnPath("/architecture/reviews/123?tab=findings")).toBe(true);
  });

  it("rejects null", () => {
    expect(isSafeReturnPath(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isSafeReturnPath(undefined)).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isSafeReturnPath("")).toBe(false);
  });

  it("rejects a path that does not start with a slash", () => {
    expect(isSafeReturnPath("reviews/123")).toBe(false);
  });

  it("rejects an absolute external URL", () => {
    expect(isSafeReturnPath("https://evil.example/phish")).toBe(false);
  });

  it("rejects a protocol-relative URL", () => {
    expect(isSafeReturnPath("//evil.example")).toBe(false);
  });

  it("rejects a protocol-relative URL with a path", () => {
    expect(isSafeReturnPath("//evil.example/steal")).toBe(false);
  });

  it("rejects a backslash-prefixed URL (browser slash-normalization trick)", () => {
    expect(isSafeReturnPath("/\\evil.example")).toBe(false);
  });

  it("rejects a javascript: URL", () => {
    expect(isSafeReturnPath("javascript:alert(1)")).toBe(false);
  });

  it("rejects a path embedding a scheme", () => {
    expect(isSafeReturnPath("/redirect://evil.example")).toBe(false);
  });

  it("rejects a protocol-relative URL smuggled via a control character", () => {
    expect(isSafeReturnPath("/\t/evil.example")).toBe(false);
  });

  it("rejects a NUL-smuggled protocol-relative URL", () => {
    expect(isSafeReturnPath("/\u0000/evil.example")).toBe(false);
  });

  it("rejects a percent-encoded protocol-relative URL", () => {
    expect(isSafeReturnPath("/%2f%2fevil.example")).toBe(false);
  });

  it("rejects a percent-encoded tab smuggling a protocol-relative URL", () => {
    expect(isSafeReturnPath("/%09//evil.example")).toBe(false);
  });

  it("rejects a percent-encoded NUL smuggling a protocol-relative URL", () => {
    expect(isSafeReturnPath("/%00//evil.example")).toBe(false);
  });

  it("rejects an embedded protocol-relative segment after percent-decoding", () => {
    expect(isSafeReturnPath("/x%2F%2Fevil.example")).toBe(false);
  });

  it("rejects a deeply percent-encoded embedded protocol-relative segment", () => {
    let payload = "//evil.example";

    for (let pass = 0; pass < 4; pass++) {
      payload = encodeURIComponent(payload);
    }

    expect(isSafeReturnPath(`/welcome${payload}`)).toBe(false);
  });

  it("rejects return paths that remain percent-encoded after the decode guard", () => {
    let payload = "//evil.example";

    for (let pass = 0; pass < 10; pass++) {
      payload = encodeURIComponent(payload);
    }

    expect(isSafeReturnPath(`/welcome${payload}`)).toBe(false);
  });

  it("rejects backslash path separators that normalize to traversal after sign-in", () => {
    expect(isSafeReturnPath("/welcome\\..\\..\\operator")).toBe(false);
    expect(isSafeReturnPath("/foo\\..\\..\\evil")).toBe(false);
    expect(isSafeReturnPath("/architecture\\reviews")).toBe(false);
  });

  it("rejects percent-encoded backslash segments after decoding", () => {
    expect(isSafeReturnPath("/welcome%5c..%5c..%5coperator")).toBe(false);
  });
});

describe("resolveSafeReturnPath", () => {
  it("returns the candidate when it is safe", () => {
    expect(resolveSafeReturnPath(SPONSOR_DASHBOARD_HREF)).toBe(SPONSOR_DASHBOARD_HREF);
  });

  it("falls back to '/' when the candidate is unsafe", () => {
    expect(resolveSafeReturnPath("//evil.example")).toBe("/");
  });

  it("falls back to '/' when the candidate is absent", () => {
    expect(resolveSafeReturnPath(undefined)).toBe("/");
  });

  it("honors a custom fallback", () => {
    expect(resolveSafeReturnPath("https://evil.example", "/welcome")).toBe("/welcome");
  });
});
