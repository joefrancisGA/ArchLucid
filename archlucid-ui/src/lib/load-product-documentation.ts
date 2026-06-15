import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getProductDocumentationEntry,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";
import {
  stripDuplicateMarkdownTitle,
  stripInternalEngineeringBatchLabels,
  stripLeadingContributorScopeBlockquote,
} from "@/lib/help-markdown-presentation";

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
  const root = resolveMonorepoRootFromUiCwd();
  const segments = relativePath.replace(/^\//, "").split("/").filter((segment) => segment.length > 0);
  const absolute = join(root, ...segments);

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

/**
 * Loads the primary markdown body for an in-app help topic from the monorepo (or Docker sample path when packaged).
 */
export function tryLoadProductDocumentation(slug: string): LoadedProductDocumentation | null {
  const entry = getProductDocumentationEntry(slug);

  if (entry === null) {
    return null;
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

  return {
    entry,
    markdown: chunks.join("\n\n---\n\n"),
  };
}
