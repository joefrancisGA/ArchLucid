import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getProductDocumentationEntry,
  inAppHelpHref,
  listProductDocumentationEntries,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const REDIRECT_STUB_MARKERS = [/moved\s+—/i, /^#\s*moved\b/i];

function isRedirectStubMarkdown(markdown: string): boolean {
  const trimmed = markdown.trim();

  if (trimmed.length < 120) {
    return REDIRECT_STUB_MARKERS.some((pattern) => pattern.test(trimmed));
  }

  return false;
}

function readRepoMarkdown(relativePath: string): string {
  const repoRoot = path.resolve(process.cwd(), "..");
  const fullPath = path.join(repoRoot, relativePath.replace(/^\//, ""));

  return readFileSync(fullPath, "utf8");
}

function assertNotRedirectStub(entry: ProductDocumentationEntry): void {
  const primary = entry.sourcePaths[0];

  if (primary === undefined) {
    return;
  }

  const markdown = readRepoMarkdown(primary);

  expect(isRedirectStubMarkdown(markdown), `${entry.slug} primary source must not be a redirect stub`).toBe(false);
}

describe("product-documentation-registry", () => {
  it("maps canonical slugs to in-app routes", () => {
    expect(inAppHelpHref("pilot-guide")).toBe("/help/pilot-guide");
    expect(getProductDocumentationEntry("troubleshooting")?.title).toBe("Troubleshooting");
  });

  it("loads markdown for every registry topic from the monorepo", () => {
    for (const entry of listProductDocumentationEntries()) {
      const loaded = tryLoadProductDocumentation(entry.slug);

      expect(loaded, `missing markdown for ${entry.slug}`).not.toBeNull();
      expect(loaded!.markdown.trim().length).toBeGreaterThan(40);
    }
  });

  it("does not register redirect-only stub paths for buyer or operator audiences (TB-146)", () => {
    for (const entry of listProductDocumentationEntries()) {
      if (entry.audience === "developer") {
        continue;
      }

      assertNotRedirectStub(entry);
    }
  });
});
