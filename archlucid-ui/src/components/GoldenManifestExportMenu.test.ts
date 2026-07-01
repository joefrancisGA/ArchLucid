import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("GoldenManifestExportMenu (TB-513)", () => {
  const source = readFileSync(join(import.meta.dirname, "GoldenManifestExportMenu.tsx"), "utf8");

  it("documents golden-manifest naming risk and avoids buyer-visible golden manifest literals", () => {
    expect(source).toMatch(/@important[\s\S]*SIGNED_MANIFEST_LABEL[\s\S]*not "golden manifest"/);
    expect(source).toMatch(/@deprecated[\s\S]*SignedReviewRecordExportMenu/);

    const stringLiteralPattern = /"[^"]*"/g;
    const literals = source.match(stringLiteralPattern) ?? [];

    for (const literal of literals) {
      const value = literal.slice(1, -1).toLowerCase();

      expect(value, literal).not.toMatch(/\bgolden manifest\b/);
    }
  });
});
