import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  listProductDocumentationEntries,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";
import {
  isDocumentationMaintenanceMetadataLine,
  prepareHelpMarkdownForPresentation,
  stripMarkdownHorizontalRules,
} from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const HORIZONTAL_RULE_LINE = /^(\*{3,}|-{3,}|_{3,})\s*$/;

function readRepoMarkdown(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath.replace(/^\//, "")), "utf8");
}

function listHorizontalRuleLines(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => HORIZONTAL_RULE_LINE.test(line));
}

function isBuyerOrOperatorHelpEntry(entry: ProductDocumentationEntry): boolean {
  return entry.audience === "buyer" || entry.audience === "operator";
}

describe("help horizontal rule presentation", () => {
  it("strips markdown horizontal rules outside fenced code blocks", () => {
    const input = [
      "## Section one",
      "",
      "---",
      "",
      "Body paragraph.",
      "",
      "```text",
      "---",
      "```",
      "",
      "***",
      "",
      "## Section two",
    ].join("\n");

    const stripped = stripMarkdownHorizontalRules(input);

    expect(stripped).toContain("## Section one");
    expect(stripped).toContain("## Section two");
    expect(stripped).toContain("```text\n---\n```");
    expect(stripped).not.toMatch(/\n\*\*\*\n\n## Section two/);
  });

  it("prepareHelpMarkdownForPresentation removes horizontal rules from rendered help", () => {
    const prepared = prepareHelpMarkdownForPresentation(
      "# Title\n\n---\n\n## Section\n\nCopy.",
      "docs/CORE_PILOT.md",
    );

    expect(listHorizontalRuleLines(prepared)).toEqual([]);
    expect(prepared).toContain("## Section");
  });

  it("keeps buyer and operator registry help topics free of horizontal rule lines after preparation", () => {
    const violations: string[] = [];
    const maintenanceViolations: string[] = [];

    for (const entry of listProductDocumentationEntries()) {
      if (!isBuyerOrOperatorHelpEntry(entry)) {
        continue;
      }

      const loaded = tryLoadProductDocumentation(entry.slug);

      if (loaded === null) {
        continue;
      }

      const sourcePath = entry.sourcePaths[0] ?? "";
      const prepared = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath);
      const rules = listHorizontalRuleLines(prepared);

      if (rules.length > 0) {
        violations.push(`${entry.slug}: ${rules.length} horizontal rule line(s) after preparation`);
      }

      const maintenanceLines = prepared
        .split("\n")
        .filter((line) => isDocumentationMaintenanceMetadataLine(line));

      if (maintenanceLines.length > 0) {
        maintenanceViolations.push(`${entry.slug}: maintenance metadata line(s) after preparation`);
      }
    }

    expect(violations).toEqual([]);
    expect(maintenanceViolations).toEqual([]);
  });
});

describe("pilot guide help copy guard", () => {
  const PILOT_GUIDE_PATH = "docs/library/customer-facing/PILOT_GUIDE.md";

  const PILOT_GUIDE_BANNED_PHRASES: readonly string[] = [
    "localhost",
    "curl -",
    "demo seed",
    "release smoke",
    "playwright",
    "v1 scope",
    "v1.1",
    "repository root",
    "cloudprovider:",
    "azure extractor",
    "phase b",
    "static operator",
  ] as const;

  it("structures pilot guide without horizontal rules in source", () => {
    const source = readRepoMarkdown(PILOT_GUIDE_PATH);

    expect(listHorizontalRuleLines(source)).toEqual([]);
    expect(source).toContain("## Prepare for a pilot");
    expect(source).toContain("## Run the first review");
    expect(source).toContain("## Review outputs");
    expect(source).toContain("## Report an issue");
    expect(source).toContain("## Get help");
    expect(source.toLowerCase()).toContain("<details");
    expect(source.toLowerCase()).toContain("advanced operator notes");
  });

  it("keeps buyer-facing pilot guide body free of internal engineering phrases", () => {
    const source = readRepoMarkdown(PILOT_GUIDE_PATH);
    const detailsClose = source.toLowerCase().indexOf("</details>");
    const buyerBody = detailsClose >= 0 ? source.slice(0, source.toLowerCase().indexOf("<details")) : source;
    const normalized = buyerBody.toLowerCase();

    const violations = PILOT_GUIDE_BANNED_PHRASES.filter((phrase) => normalized.includes(phrase));

    expect(violations).toEqual([]);
    expect(normalized).toContain("azure, aws, and gcp");
  });
});
