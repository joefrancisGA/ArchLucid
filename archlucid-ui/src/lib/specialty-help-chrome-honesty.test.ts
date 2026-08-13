import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SPECIALTY_HELP_CHROME_BELOW_50_INVENTORY } from "@/lib/specialty-help-chrome-below-50-inventory";
import {
  SPECIALTY_HELP_CHROME_HONESTY_SCAN_FILES,
  SPECIALTY_HELP_CHROME_INVENTORY_DRIFT_GUARD_SLUGS,
  sourceContainsAffirmativeSpecialtyHelpChromeOverclaim,
} from "@/lib/specialty-help-chrome-honesty-surfaces";

const REPO_ROOT = join(process.cwd(), "..");

function readHonestyScanSource(relativePath: string): string {
  const base = relativePath.startsWith("docs/") ? REPO_ROOT : process.cwd();

  return readFileSync(join(base, relativePath), "utf8");
}

/** TB-1415: buyer copy must not overclaim specialty chrome or TB-735 technical-help gating. */
describe("specialty help chrome honesty guard (TB-1415)", () => {
  it("keeps open ≤~50 inventory slugs on the drift guard until clusters are Done", () => {
    const inventorySlugs = new Set(
      SPECIALTY_HELP_CHROME_BELOW_50_INVENTORY.map((entry) => entry.slug),
    );
    const driftGuard = new Set(SPECIALTY_HELP_CHROME_INVENTORY_DRIFT_GUARD_SLUGS);

    for (const slug of SPECIALTY_HELP_CHROME_INVENTORY_DRIFT_GUARD_SLUGS) {
      expect(inventorySlugs.has(slug), `missing inventory row for ${slug}`).toBe(true);
    }

    for (const entry of SPECIALTY_HELP_CHROME_BELOW_50_INVENTORY) {
      if (entry.clusterDone) {
        expect(driftGuard.has(entry.slug), `done slug ${entry.slug} should leave drift guard`).toBe(
          false,
        );
        continue;
      }

      expect(driftGuard.has(entry.slug), `open slug ${entry.slug} must stay on drift guard`).toBe(
        true,
      );
    }
  });

  it("buyer/docs scan targets do not affirmatively overclaim specialty chrome or TB-735 gating", () => {
    for (const relativePath of SPECIALTY_HELP_CHROME_HONESTY_SCAN_FILES) {
      const source = readHonestyScanSource(relativePath);
      const matched = sourceContainsAffirmativeSpecialtyHelpChromeOverclaim(source);

      expect(matched, `${relativePath} matched banned phrase ${matched ?? ""}`).toBeNull();
    }
  });

  it("engineering contract cites TB-1415 honesty CI and M-251 claim boundary", () => {
    const contract = readHonestyScanSource("docs/library/SPECIALTY_HELP_CHROME_CONTRACT.md");

    expect(contract).toMatch(/TB-1415/);
    expect(contract).toMatch(/M-251/);
    expect(contract).toMatch(/check_specialty_help_chrome_honesty\.py/);
    expect(contract).toMatch(/HelpTopicMarkdownView/);
    expect(contract).toMatch(/technical-documentation/);
  });

  it("CI guard script exists at repo root", () => {
    const source = readFileSync(
      join(REPO_ROOT, "scripts/ci/check_specialty_help_chrome_honesty.py"),
      "utf8",
    );

    expect(source).toContain("TB-1415");
    expect(source).toContain("all help is specialty-guided");
    expect(source).toContain("tb-735 gates all technical help");
    expect(source).toContain("specialty-help-chrome-below-50-inventory.ts");
  });
});
