/**
 * TB-2091 — forbid universal CPA SOC 2 / third-party pen-test disclaimer chrome
 * outside dedicated assurance surfaces.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const LIB_ROOT = join(process.cwd(), "src", "lib");

/** Basename stems allowed to keep factual CPA / pen-test honesty. */
const ALLOWLIST_STEMS = new Set([
  "trust-center-evidence-copy",
  "security-trust-evidence-copy",
  "settings-security-trust-evidence-copy",
  "security-trust-help-evidence-copy",
  "procurement-help-evidence-copy",
  "caiq-sig-response-help-evidence-copy",
  "soc2-self-assessment-help-guide-content",
  "soc2-self-assessment-help-evidence-copy",
  "dpa-template-help-guide-content",
  "ui-route-traffic-trust-center",
  "ui-route-traffic-security-trust",
  "ui-route-traffic-settings-security-trust",
  "ui-route-traffic-security-trust-help",
  "ui-route-traffic-procurement-help",
  "ui-route-traffic-caiq-sig-response-help",
  "ui-route-traffic-soc2-self-assessment-help",
  "contextual-help-registry",
  "help-markdown-presentation",
  "help-index.generated",
  "tb2091-cpa-pen-disclaimer-guard",
]);

const FORBIDDEN = [
  /Do not imply CPA SOC 2/i,
  /Does not imply CPA SOC 2 or third-party pen-test publication/i,
  /a CPA SOC 2 attestation/i,
  /a CPA-issued SOC 2 report/i,
  /a published third-party pen[- ]test report/i,
  /and does not imply CPA SOC 2 attestation/i,
];

const SCAN_SUFFIXES = [
  "evidence-copy.ts",
  "guide-content.ts",
  "page-copy.ts",
  "-sources.ts",
] as const;

function shouldScan(fileName: string): boolean {
  if (fileName.endsWith(".test.ts")) {
    return false;
  }

  if (fileName.startsWith("ui-route-traffic-")) {
    return true;
  }

  return SCAN_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}

function collectLibFiles(dir: string): string[] {
  const out: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...collectLibFiles(full));
      continue;
    }

    if (entry.isFile() && shouldScan(entry.name)) {
      out.push(full);
    }
  }

  return out;
}

describe("TB-2091 CPA / pen-test disclaimer chrome guard", () => {
  it("keeps boilerplate out of non-allowlisted claim/copy modules", () => {
    const violations: string[] = [];

    for (const absolutePath of collectLibFiles(LIB_ROOT)) {
      const stem = absolutePath.replace(/\\/g, "/").split("/").pop()?.replace(/\.ts$/, "") ?? "";

      if (ALLOWLIST_STEMS.has(stem)) {
        continue;
      }

      const source = readFileSync(absolutePath, "utf8");

      for (const pattern of FORBIDDEN) {
        if (pattern.test(source)) {
          violations.push(`${stem}: matched ${pattern}`);
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
