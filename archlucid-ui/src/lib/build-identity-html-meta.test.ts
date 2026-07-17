import { describe, expect, it, vi } from "vitest";

import {
  BUILD_IDENTITY_HTML_META_NAME,
  extractBuildIdentityFromHtml,
  readBuildIdentityHtmlMetaContent,
} from "@/lib/build-identity-html-meta";

describe("build-identity-html-meta", () => {
  it("exposes a stable meta name for CD smoke", () => {
    expect(BUILD_IDENTITY_HTML_META_NAME).toBe("archlucid:build-commit");
  });

  it("reads build commit from NEXT_PUBLIC_BUILD_COMMIT_SHA", () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "abcdef1234567890abcdef1234567890abcdef12");

    expect(readBuildIdentityHtmlMetaContent()).toBe(
      "abcdef1234567890abcdef1234567890abcdef12",
    );
  });

  it("extracts build identity meta from HTML (name before content)", () => {
    const html =
      '<html><head><meta name="archlucid:build-commit" content="abc123" /></head></html>';

    expect(extractBuildIdentityFromHtml(html)).toBe("abc123");
  });

  it("extracts build identity meta from HTML (content before name)", () => {
    const html =
      '<html><head><meta content="def456" name="archlucid:build-commit" /></head></html>';

    expect(extractBuildIdentityFromHtml(html)).toBe("def456");
  });

  it("returns null when meta tag is missing", () => {
    expect(extractBuildIdentityFromHtml("<html><head></head></html>")).toBeNull();
  });
});
