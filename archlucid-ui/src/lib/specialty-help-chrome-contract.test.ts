import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SPECIALTY_HELP_CHROME_BELOW_50_INVENTORY,
  SPECIALTY_HELP_CHROME_CONTRACT_PATH,
  SPECIALTY_HELP_CHROME_EXEMPLAR_COMPONENTS,
  SPECIALTY_HELP_CHROME_RELATED_GUIDES_MAX,
} from "@/lib/specialty-help-chrome-below-50-inventory";
import { SPECIALTY_HELP_CHROME_RETIRED_BELOW_50_INVENTORY } from "@/lib/specialty-help-chrome-retired-below-50-inventory";

function readRepoRelativeFile(relativePath: string): string {
  const base = relativePath.startsWith("docs/") ? join(process.cwd(), "..") : process.cwd();

  return readFileSync(join(base, relativePath), "utf8");
}

describe("specialty help chrome contract (TB-1414)", () => {
  it("keeps the ranked ≤~50 inventory mapped to owning TB clusters", () => {
    expect(SPECIALTY_HELP_CHROME_BELOW_50_INVENTORY.length).toBe(6);
    expect(SPECIALTY_HELP_CHROME_RETIRED_BELOW_50_INVENTORY.length).toBe(2);

    for (const entry of SPECIALTY_HELP_CHROME_BELOW_50_INVENTORY) {
      expect(entry.helpPath).toMatch(/^\/help\//);
      expect(entry.owningClusterId).toMatch(/^TB-\d+$/);
      expect(entry.approximateScore).toBeLessThanOrEqual(50);
      expect(entry.clusterDone).toBe(true);
    }

    const slugs = SPECIALTY_HELP_CHROME_BELOW_50_INVENTORY.map((entry) => entry.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("engineering-troubleshooting");
    expect(slugs).toContain("procurement");
    expect(slugs).not.toContain("evaluator-workbook");
    expect(slugs).not.toContain("first-hour-operator-path");
  });

  it("names specialty exemplars and Related density cap for implementers", () => {
    expect(SPECIALTY_HELP_CHROME_EXEMPLAR_COMPONENTS.length).toBeGreaterThanOrEqual(3);
    expect(SPECIALTY_HELP_CHROME_EXEMPLAR_COMPONENTS).toContain("HelpCorePilotGuideView");
    expect(SPECIALTY_HELP_CHROME_RELATED_GUIDES_MAX).toBe(3);
  });

  it("publishes engineering contract prose with tier, CTA, and claim-boundary anchors", () => {
    const contract = readRepoRelativeFile(SPECIALTY_HELP_CHROME_CONTRACT_PATH);

    expect(contract).toMatch(/TB-1414/);
    expect(contract).toMatch(/HelpTopicMarkdownView/);
    expect(contract).toMatch(/contentKind/);
    expect(contract).toMatch(/M-251/);
    expect(contract).toMatch(/M-252/);
    expect(contract).toMatch(/Related density/i);
    expect(contract).toMatch(/TB-1415/);
  });
});
