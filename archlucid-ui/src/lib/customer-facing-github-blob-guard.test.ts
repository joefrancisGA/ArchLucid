import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  HELP_TOPIC_BOOKMARK_ONLY_REDIRECT_SLUGS,
  HELP_TOPIC_PERMANENT_REDIRECTS,
} from "@/lib/help/help-topic-permanent-redirects";
import { isInternalRunbookSlug } from "@/lib/product-documentation-content-kinds";
import { PRODUCT_DOCUMENTATION_REGISTRY } from "@/lib/product-documentation-registry";
import { textContainsGitHubBlobOrTreeUrl } from "@/lib/github-blob-url-contains";

/** Paths scanned for customer-facing GitHub blob links (operator + marketing surfaces). */
const CUSTOMER_SURFACE_DIRS = [
  "src/app/(operator)",
  "src/app/(marketing)",
  "src/components",
  "src/lib/contextual-help-content.ts",
  "src/lib/help/help-topics.ts",
  "src/lib/docs-search-index.ts",
  "src/lib/in-app-doc-href.ts",
] as const;

const ALLOWLIST_SUBSTRINGS = [] as const;

function collectSourceFiles(relativeDir: string): string[] {
  const root = path.join(process.cwd(), relativeDir);
  const results: string[] = [];

  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    if (statSync(root, { throwIfNoEntry: false })?.isFile()) {
      results.push(root);
    }

    return results;
  }

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);

    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(path.relative(process.cwd(), full)));
      continue;
    }

    if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      results.push(full);
    }
  }

  return results;
}

describe("customer-facing GitHub blob link guard", () => {
  it("registry topics resolve to in-app help routes", () => {
    for (const entry of PRODUCT_DOCUMENTATION_REGISTRY) {
      expect(entry.slug.length).toBeGreaterThan(0);
      expect(`/help/${entry.slug}`).toMatch(/^\/help\/[a-z0-9-]+$/);
    }
  });

  it("doc-index.json does not use GitHub blob URLs", () => {
    const raw = readFileSync(path.join(process.cwd(), "public/doc-index.json"), "utf8");
    const index = JSON.parse(raw) as Array<{ title: string; url: string }>;

    for (const row of index) {
      expect(row.url, `doc-index entry "${row.title}" must not use GitHub blob URLs`).not.toMatch(
        /^https?:\/\/github\.com\/[^/]+\/[^/]+\/blob\//i,
      );
    }
  });

  it("doc-index.json uses in-app routes for registry-mapped buyer topics", () => {
    const raw = readFileSync(path.join(process.cwd(), "public/doc-index.json"), "utf8");
    const index = JSON.parse(raw) as Array<{ title: string; url: string }>;

    const registryTitles = new Set(PRODUCT_DOCUMENTATION_REGISTRY.map((e) => e.title.toLowerCase()));

    for (const row of index) {
      if (!registryTitles.has(row.title.toLowerCase())) {
        continue;
      }

      expect(row.url, `doc-index entry "${row.title}" must use in-app help`).toMatch(/^\/help\//);
    }
  });

  it("doc-index.json omits fully retired help bookmark paths", () => {
    const raw = readFileSync(path.join(process.cwd(), "public/doc-index.json"), "utf8");
    const index = JSON.parse(raw) as Array<{ title: string; url: string }>;
    const retiredPaths = new Set(
      Object.keys(HELP_TOPIC_PERMANENT_REDIRECTS)
        .filter((slug) => !(HELP_TOPIC_BOOKMARK_ONLY_REDIRECT_SLUGS as readonly string[]).includes(slug))
        .map((slug) => `/help/${slug}`),
    );

    for (const row of index) {
      expect(retiredPaths.has(row.url), `doc-index must not list retired help path ${row.url}`).toBe(
        false,
      );
    }
  });

  it("doc-index.json omits Admin-only internal-runbook help topics (TB-1385)", () => {
    const raw = readFileSync(path.join(process.cwd(), "public/doc-index.json"), "utf8");
    const index = JSON.parse(raw) as Array<{ title: string; url: string }>;

    for (const row of index) {
      const match = row.url.match(/^\/help\/([^#/?]+)/);

      if (match === null) {
        continue;
      }

      expect(isInternalRunbookSlug(match[1]!), `doc-index must not list ${row.url}`).toBe(false);
    }
  });

  it("operator and marketing surfaces do not introduce new GitHub blob links in primary UI", () => {
    const violations: string[] = [];

    for (const dir of CUSTOMER_SURFACE_DIRS) {
      for (const file of collectSourceFiles(dir)) {
        const normalized = file.replace(/\\/g, "/");

        if (ALLOWLIST_SUBSTRINGS.some((allowed) => normalized.includes(allowed))) {
          continue;
        }

        const content = readFileSync(file, "utf8");

        if (!textContainsGitHubBlobOrTreeUrl(content)) {
          continue;
        }

        const lines = content.split(/\r?\n/);

        lines.forEach((line, index) => {
          if (textContainsGitHubBlobOrTreeUrl(line)) {
            violations.push(`${normalized}:${index + 1}: ${line.trim()}`);
          }
        });
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
