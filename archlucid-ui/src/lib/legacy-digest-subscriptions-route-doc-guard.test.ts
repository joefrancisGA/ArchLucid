import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CANONICAL_DIGEST_SUBSCRIPTIONS_PATH } from "@/lib/digest-subscriptions-legacy-route";

const LEGACY_DIGEST_SUBSCRIPTIONS_PATH_PATTERN = /\/digest-subscriptions(?!\/)/g;
const LEGACY_PATH_ALLOWED_ON_LINE = /redirect|retired|legacy|unreachable|remove|bookmark|fold|migration|→|canonicalize/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/ui_route_traffic_estimates.template.md",
  "docs/library/OPERATOR_ATLAS.md",
  "docs/library/PRODUCT_PACKAGING.md",
] as const;

const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledLegacyPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!LEGACY_DIGEST_SUBSCRIPTIONS_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-digest-subscriptions-route-doc-guard (TB-1494/TB-1495)", () => {
  it("documents the canonical Digests Subscriptions tab path", () => {
    expect(CANONICAL_DIGEST_SUBSCRIPTIONS_PATH).toBe("/architecture/digests?tab=subscriptions");
  });

  it("labels the legacy /digest-subscriptions path redirect-only in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy digest-subscriptions path in ${relativePath}`).toEqual([]);
    }
  });

  it("groups /digest-subscriptions with Digests hub paths in Python catalog (TB-1493)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('path == "/digest-subscriptions"');
    expect(catalogSource).toContain('path.startswith("/architecture/digests")');
  });
});
