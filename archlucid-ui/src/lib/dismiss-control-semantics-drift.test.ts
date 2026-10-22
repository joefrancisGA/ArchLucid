import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

function collectTsxFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTsxFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

const dismissLinkPattern = /<(?:Link|a)\b[^>]*>[\s\S]{0,80}?Dismiss[\s\S]{0,80}?<\/(?:Link|a)>/g;
const dismissLinkVariantPattern = /variant=["']link["'][\s\S]{0,200}?Dismiss/g;

describe("dismiss control semantics drift guard", () => {
  it("does not render in-place Dismiss actions as links or link-styled buttons", () => {
    const offenders: string[] = [];

    for (const filePath of collectTsxFiles(SRC_ROOT)) {
      const source = readFileSync(filePath, "utf8");
      const relativePath = filePath.replace(`${SRC_ROOT}\\`, "src\\").replace(`${SRC_ROOT}/`, "src/");

      for (const match of source.matchAll(dismissLinkPattern)) {
        if (match[0].includes('href="/quick-scan"') || match[0].includes('href="/architecture/reviews"')) {
          continue;
        }

        offenders.push(`${relativePath}: ${match[0].replace(/\s+/g, " ").trim()}`);
      }

      for (const match of source.matchAll(dismissLinkVariantPattern)) {
        offenders.push(`${relativePath}: ${match[0].replace(/\s+/g, " ").trim()}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
