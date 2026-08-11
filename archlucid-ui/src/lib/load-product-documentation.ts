import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

import { getFoldedInternalRunbookEntry } from "@/lib/folded-internal-runbook-help";
import {
  getProductDocumentationEntry,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";
import {
  stripDuplicateMarkdownTitle,
  stripInternalEngineeringBatchLabels,
  stripLeadingContributorScopeBlockquote,
} from "@/lib/help-markdown-presentation";
import { extractMarkdownSectionsByAnchor } from "@/lib/help-markdown-sections";

export type LoadedProductDocumentation = {
  entry: ProductDocumentationEntry;
  markdown: string;
};

function resolveMonorepoRootFromUiCwd(): string {
  const cwd = process.cwd();

  if (existsSync(join(cwd, "..", "docs", "library"))) {
    return join(cwd, "..");
  }

  return cwd;
}

function readRepoRelativeMarkdown(relativePath: string): string | null {
  const normalized = relativePath.replace(/^\//, "").trim();

  if (!normalized.startsWith("docs/")) {
    return null;
  }

  const root = resolveMonorepoRootFromUiCwd();
  const withinDocs = normalized
    .slice("docs/".length)
    .split("/")
    .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..");

  if (withinDocs.length === 0) {
    return null;
  }

  const absolute = join(root, "docs", ...withinDocs);

  if (!existsSync(absolute)) {
    return null;
  }

  return readFileSync(absolute, "utf8").replace(/\r\n/g, "\n");
}

function prepareHelpSourceMarkdown(markdown: string): string {
  let result = stripLeadingContributorScopeBlockquote(markdown);
  result = stripInternalEngineeringBatchLabels(result);
  result = stripDuplicateMarkdownTitle(result);

  return result.trimStart();
}

function loadMarkdownForEntry(entry: ProductDocumentationEntry): LoadedProductDocumentation | null {
  if (entry.sourcePaths.length === 0) {
    return {
      entry,
      markdown: "",
    };
  }

  const chunks: string[] = [];

  for (const sourcePath of entry.sourcePaths) {
    const body = readRepoRelativeMarkdown(sourcePath);

    if (body !== null && body.trim().length > 0) {
      chunks.push(prepareHelpSourceMarkdown(body));
    }
  }

  if (chunks.length === 0) {
    return null;
  }

  let markdown = chunks.join("\n\n---\n\n");

  if (entry.sectionAnchors !== undefined && entry.sectionAnchors.length > 0) {
    markdown = extractMarkdownSectionsByAnchor(
      markdown,
      entry.sectionAnchors,
      entry.includeIntroWithSections === true,
    );
  }

  return {
    entry,
    markdown,
  };
}

/**
 * Loads the primary markdown body for an in-app help topic from the monorepo (or Docker sample path when packaged).
 * Entries with empty `sourcePaths` are app-rendered topics and succeed with empty markdown.
 * Cached per slug within a single RSC request (metadata + page, folded sections).
 */
export const tryLoadProductDocumentation = cache((slug: string): LoadedProductDocumentation | null => {
  const entry = getProductDocumentationEntry(slug);

  if (entry === null) {
    return null;
  }

  return loadMarkdownForEntry(entry);
});

/** Loads markdown for Admin runbooks folded into canonical help pages (Batch R). */
export const tryLoadFoldedInternalRunbook = cache((slug: string): LoadedProductDocumentation | null => {
  const entry = getFoldedInternalRunbookEntry(slug);

  if (entry === null) {
    return null;
  }

  return loadMarkdownForEntry(entry);
});
