import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
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
});

describe("resolveSafeReturnPath", () => {
  it("returns the candidate when it is safe", () => {
    expect(resolveSafeReturnPath(EXECUTIVE_DASHBOARD_HREF)).toBe(EXECUTIVE_DASHBOARD_HREF);
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
