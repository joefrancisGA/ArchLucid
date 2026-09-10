import { describe, expect, it } from "vitest";

import {
  compileAllowlistLinePatterns,
  isArchLucidLineAllowlisted,
  scanFileForArchLucidLeaks,
} from "@/lib/product-line/securenow-archlucid-leak-scanner";

describe("securenow-archlucid-leak-scanner", () => {
  const sampleLinePatterns = compileAllowlistLinePatterns([
    { pattern: "@archlucid\\.net", reason: "Company email" },
    { pattern: "hosted ArchLucid", reason: "Legal entity phrasing" },
    { pattern: "^\\s*//", reason: "Line comment" },
  ]);

  it("flags disallowed consumer ArchLucid copy", () => {
    const violations = scanFileForArchLucidLeaks(
      "src/lib/example-copy.ts",
      'export const TITLE = "ArchLucid stores connection metadata";',
      sampleLinePatterns,
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.excerpt).toContain("ArchLucid stores connection metadata");
  });

  it("allows company email and hosted ArchLucid phrasing", () => {
    const violations = scanFileForArchLucidLeaks(
      "src/lib/example-copy.ts",
      [
        'export const CONTACT = "security@archlucid.net";',
        'export const NOTE = "hosted ArchLucid SaaS that delivers SecureNow";',
      ].join("\n"),
      sampleLinePatterns,
    );

    expect(violations).toEqual([]);
  });

  it("allows ArchLucid in line comments", () => {
    const violations = scanFileForArchLucidLeaks(
      "src/lib/example-copy.ts",
      "// ArchLucid is the architecture product name",
      sampleLinePatterns,
    );

    expect(violations).toEqual([]);
  });

  it("matches whole-word ArchLucid only", () => {
    expect(isArchLucidLineAllowlisted("ArchLucid.Api reference", sampleLinePatterns)).toBe(false);
    expect(
      isArchLucidLineAllowlisted(
        "Third-party subprocessors register for hosted ArchLucid SaaS.",
        sampleLinePatterns,
      ),
    ).toBe(true);
  });
});
