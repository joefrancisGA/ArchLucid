import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  listOperatorPrimaryCtaVerifiedEntries,
  type OperatorPrimaryCtaPattern,
} from "@/lib/operator/operator-primary-cta-inventory";

const UI_ROOT = join(process.cwd());

function readUiSource(relativePathFromSrc: string): string {
  const normalized = relativePathFromSrc.startsWith("src/")
    ? relativePathFromSrc
    : `src/${relativePathFromSrc}`;

  return readFileSync(join(UI_ROOT, normalized), "utf8");
}

function countPrimaryVariants(source: string): number {
  const matches = source.match(/variant="primary"|variant=\{'primary'\}|variant=\{"primary"\}/g);

  return matches?.length ?? 0;
}

function maxPrimaryVariantsForPattern(pattern: OperatorPrimaryCtaPattern): number {
  if (pattern === "header-create-reveals-panel" || pattern === "empty-footer-create") {
    return 2;
  }

  return 1;
}

describe("operator primary CTA dual-primary guard (TB-1544)", () => {
  it("guards every verified inventory hub against dual-primary drift", () => {
    for (const entry of listOperatorPrimaryCtaVerifiedEntries()) {
      const source = readUiSource(entry.componentOrModule);
      const primaryCount = countPrimaryVariants(source);
      const maxAllowed = maxPrimaryVariantsForPattern(entry.pattern);

      expect(primaryCount, `${entry.id} (${entry.componentOrModule})`).toBeLessThanOrEqual(maxAllowed);
      expect(source, `${entry.id} primary test id`).toContain(entry.primaryTestId);
    }
  });

  it("does not mark View/Open navigation links as primary when a Create/Start test id exists", () => {
    for (const entry of listOperatorPrimaryCtaVerifiedEntries()) {
      const source = readUiSource(entry.componentOrModule);
      const primaryTestIdPresent = source.includes(entry.primaryTestId);

      if (!primaryTestIdPresent) {
        continue;
      }

      const viewOpenPrimaryPattern =
        /(?:View|Open)[^<\n]{0,120}variant="primary"|variant="primary"[^>\n]{0,120}(?:View|Open)/;

      expect(
        viewOpenPrimaryPattern.test(source),
        `${entry.id} must not pair View/Open navigation with a filled primary`,
      ).toBe(false);
    }
  });
});
