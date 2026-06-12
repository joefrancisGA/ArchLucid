import { dirname, normalize } from "node:path/posix";

import { tryResolveInAppDocHref } from "@/lib/in-app-doc-href";

const MARKDOWN_FILE_PATTERN = /\.md(?:#[^\s)]*)?$/i;

/**
 * Turns repo filenames like `OPERATOR_ATLAS.md` into operator-facing labels (no extension).
 */
export function humanizeMarkdownFileReference(pathOrName: string): string {
  const withoutFragment = pathOrName.split("#")[0] ?? pathOrName;
  const baseName = withoutFragment.split("/").pop() ?? withoutFragment;
  const withoutExtension = baseName.replace(/\.md$/i, "");

  return withoutExtension
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function stripWrappingQuotes(value: string): string {
  return value.replace(/^[`'"]+|[`'"]+$/g, "").trim();
}

/**
 * Prefer human labels over raw repo filenames in rendered help copy.
 */
export function humanizeMarkdownLinkLabel(label: string, href: string): string {
  const cleanedLabel = stripWrappingQuotes(label);
  const cleanedHref = href.trim();

  if (MARKDOWN_FILE_PATTERN.test(cleanedLabel) || cleanedLabel === cleanedHref) {
    return humanizeMarkdownFileReference(cleanedLabel);
  }

  return cleanedLabel;
}

/**
 * Resolves `[text](relative.md)` targets against the help topic's primary source path.
 */
export function resolveRelativeRepoDocPath(href: string, sourceDocPath: string): string {
  const hrefPath = (href.split("#")[0] ?? href).trim();

  if (hrefPath.length === 0) {
    return "";
  }

  if (/^(docs|archlucid-ui)\//i.test(hrefPath)) {
    return hrefPath.replace(/^\//, "");
  }

  const sourceDir = dirname(sourceDocPath.replace(/^\//, ""));
  const joined = normalize(`${sourceDir}/${hrefPath}`);

  return joined.replace(/^\//, "");
}

/**
 * Rewrites internal markdown links to in-app `/help/{slug}` routes or plain labels.
 */
export function rewriteHelpMarkdownDocLinks(markdown: string, sourceDocPath: string): string {
  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label: string, href: string) => {
    const trimmedHref = href.trim();

    if (
      trimmedHref.startsWith("http://")
      || trimmedHref.startsWith("https://")
      || trimmedHref.startsWith("mailto:")
    ) {
      return full;
    }

    if (trimmedHref.startsWith("/help")) {
      return `[${humanizeMarkdownLinkLabel(label, trimmedHref)}](${trimmedHref})`;
    }

    const hashIndex = trimmedHref.indexOf("#");
    const hrefPath = hashIndex >= 0 ? trimmedHref.slice(0, hashIndex) : trimmedHref;
    const fragment = hashIndex >= 0 ? trimmedHref.slice(hashIndex) : "";
    const repoPath = resolveRelativeRepoDocPath(hrefPath, sourceDocPath);
    const inAppHref = tryResolveInAppDocHref(`${repoPath}${fragment}`);
    const displayLabel = humanizeMarkdownLinkLabel(label, trimmedHref);

    if (inAppHref !== null) {
      return `[${displayLabel}](${inAppHref})`;
    }

    return displayLabel;
  });
}

/**
 * Removes bare `.md` filenames and repo paths from help body copy.
 */
export function sanitizeBareMarkdownFileReferences(text: string): string {
  let result = text.replace(/`([^`\n]+\.md(?:#[^`\n]*)?)`/gi, (_match, inner: string) =>
    humanizeMarkdownFileReference(inner),
  );

  result = result.replace(
    /\*\*([A-Za-z0-9_./-]+\.md(?:#[^\s*]*)?)\*\*/g,
    (_match, inner: string) => `**${humanizeMarkdownFileReference(inner)}**`,
  );

  result = result.replace(/\[(`[^`]+\.md`|[^\]]+\.md)\]/g, (_match, inner: string) =>
    humanizeMarkdownFileReference(stripWrappingQuotes(inner)),
  );

  result = result.replace(/\b([A-Z][A-Z0-9_]*\.md)\b/g, (_match, inner: string) =>
    humanizeMarkdownFileReference(inner),
  );

  result = result.replace(
    /\b(?:docs|archlucid-ui\/docs)\/[A-Za-z0-9_./-]+\.md(?:#[^\s)]*)?\b/gi,
    (match) => humanizeMarkdownFileReference(match),
  );

  return result;
}

/**
 * Removes internal engineering batch labels (e.g. "Change Set 55R") from operator-facing help copy.
 */
export function stripInternalEngineeringBatchLabels(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) =>
      line
        .replace(/\s*\(Change Set \d+[A-Z]\)/gi, "")
        .replace(/\s*—\s*Change Set \d+[A-Z]/gi, "")
        .replace(/\s*-\s*Change Set \d+[A-Z]/gi, ""),
    )
    .join("\n");
}

/**
 * Drops the first markdown H1 — the help shell already renders `entry.title` in the page header.
 */
export function stripDuplicateMarkdownTitle(markdown: string): string {
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length && (lines[index] ?? "").trim().length === 0) {
    index++;
  }

  const first = lines[index] ?? "";

  if (first.startsWith("# ") && !first.startsWith("## ")) {
    index++;
  }

  while (index < lines.length && (lines[index] ?? "").trim().length === 0) {
    index++;
  }

  return lines.slice(index).join("\n").trimStart();
}

/**
 * Drops contributor-only preamble blockquotes at the top of library markdown files.
 */
export function stripLeadingContributorScopeBlockquote(markdown: string): string {
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (line.trim().length === 0) {
      index++;
      continue;
    }

    if (line.trimStart().startsWith(">")) {
      index++;
      continue;
    }

    break;
  }

  return lines.slice(index).join("\n").trimStart();
}

/**
 * Prepares repo markdown for in-app help rendering — no raw `.md` paths in operator UI.
 */
export function prepareHelpMarkdownForPresentation(markdown: string, sourceDocPath: string): string {
  const withoutPreamble = stripLeadingContributorScopeBlockquote(markdown);
  const normalized = stripDuplicateMarkdownTitle(stripInternalEngineeringBatchLabels(withoutPreamble));
  const rewrittenLinks = rewriteHelpMarkdownDocLinks(normalized, sourceDocPath);

  return sanitizeBareMarkdownFileReferences(rewrittenLinks);
}
