import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EXPORT_FORMAT_MARKDOWN } from "@/lib/export-format-when-to-use";

describe("GoldenManifestExportMenu (TB-513)", () => {
  const source = readFileSync(join(import.meta.dirname, "GoldenManifestExportMenu.tsx"), "utf8");

  it("documents golden-manifest naming risk and avoids buyer-visible golden manifest literals", () => {
    expect(source).toMatch(/@important[\s\S]*SIGNED_MANIFEST_LABEL[\s\S]*not "golden manifest"/);
    expect(source).toMatch(/@deprecated[\s\S]*SignedReviewRecordExportMenu/);

    const sourceWithoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const stringLiteralPattern = /"[^"]*"/g;
    const literals = sourceWithoutComments.match(stringLiteralPattern) ?? [];

    for (const literal of literals) {
      const value = literal.slice(1, -1).toLowerCase();

      expect(value, literal).not.toMatch(/\bgolden manifest\b/);
    }
  });
});

describe("GoldenManifestExportMenu (TB-2202)", () => {
  const source = readFileSync(join(import.meta.dirname, "GoldenManifestExportMenu.tsx"), "utf8");

  it("wires ExportFormatWhenToUseHint and demotes More formats opacity", () => {
    expect(source).toContain("ExportFormatWhenToUseHint");
    expect(source).toContain('format="markdown"');
    expect(source).toContain("EXPORT_FORMAT_MARKDOWN");
    expect(source).toContain("opacity-60");
    expect(source).toContain("More formats");
    expect(source).toContain("EXPORT_FORMAT_MARKDOWN.label");
    expect(EXPORT_FORMAT_MARKDOWN.recommendedFor).toBe("email");
  });
});