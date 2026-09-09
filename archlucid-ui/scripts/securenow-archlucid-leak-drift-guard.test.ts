import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  formatSecureNowArchLucidLeakViolations,
  loadSecureNowArchLucidLeakAllowlist,
  scanFileForArchLucidLeaks,
  scanSecureNowArchLucidLeaks,
} from "../src/lib/product-line/securenow-archlucid-leak-scanner";

const UI_ROOT = process.cwd();
const ALLOWLIST_PATH = join(UI_ROOT, "..", "scripts/ci/data/securenow-archlucid-allowlist.json");

describe("securenow ArchLucid leak drift guard (SN-07)", () => {
  const allowlist = loadSecureNowArchLucidLeakAllowlist(ALLOWLIST_PATH);
  const compiledLinePatterns = allowlist.linePatterns.map((entry) => new RegExp(entry.pattern));

  it("loads the CI allowlist with strict migrated paths", () => {
    expect(allowlist.strictPaths).toContain("src/lib/security-trust-product-copy.ts");
    expect(allowlist.fileExclusions.length).toBeGreaterThan(0);
    expect(allowlist.linePatterns.length).toBeGreaterThan(0);
  });

  it("detects a new disallowed ArchLucid consumer sentence", () => {
    const violations = scanFileForArchLucidLeaks(
      "src/lib/example-copy.ts",
      'export const BODY = "ArchLucid stores connection metadata in your tenant.";',
      compiledLinePatterns,
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.excerpt).toContain("ArchLucid stores connection metadata");
  });

  it("keeps SN-01–SN-06 strict copy modules free of disallowed ArchLucid leaks", () => {
    const violations = scanSecureNowArchLucidLeaks(UI_ROOT, allowlist).filter((violation) =>
      allowlist.strictPaths.includes(violation.relativePath),
    );

    expect(
      violations,
      formatSecureNowArchLucidLeakViolations(violations),
    ).toEqual([]);
  });

  it("passes the scanned Security-shell copy surface with documented allowlist gaps", () => {
    const violations = scanSecureNowArchLucidLeaks(UI_ROOT, allowlist);

    expect(
      violations,
      formatSecureNowArchLucidLeakViolations(violations),
    ).toEqual([]);
  });
});
