/**
 * TB-2091 — forbid universal CPA SOC 2 / third-party pen-test disclaimer chrome
 * outside dedicated assurance surfaces.
 *
 * Scans git-tracked files only so concurrent untracked Evidence WIP does not fail the suite.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_ROOT = process.cwd();
const REPO_ROOT = join(UI_ROOT, "..");

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

function shouldScan(relativePath: string): boolean {
  const fileName = relativePath.split("/").pop() ?? "";

  if (fileName.endsWith(".test.ts")) {
    return false;
  }

  if (!relativePath.startsWith("archlucid-ui/src/lib/")) {
    return false;
  }

  if (fileName.startsWith("ui-route-traffic-")) {
    return true;
  }

  return (
    fileName.includes("evidence-copy")
    || fileName.endsWith("guide-content.ts")
    || fileName.endsWith("page-copy.ts")
    || fileName.endsWith("-sources.ts")
  );
}

function listTrackedLibCandidates(): string[] {
  const output = execFileSync(
    "git",
    ["ls-files", "--", "archlucid-ui/src/lib"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && shouldScan(line));
}

describe("TB-2091 CPA / pen-test disclaimer chrome guard", () => {
  it("keeps boilerplate out of non-allowlisted claim/copy modules", () => {
    const violations: string[] = [];

    for (const relativePath of listTrackedLibCandidates()) {
      const stem = relativePath.split("/").pop()?.replace(/\.ts$/, "") ?? "";

      if (ALLOWLIST_STEMS.has(stem)) {
        continue;
      }

      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");

      for (const pattern of FORBIDDEN) {
        if (pattern.test(source)) {
          violations.push(`${stem}: matched ${pattern}`);
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
