import { tryResolveInAppDocHref } from "@/lib/in-app-doc-href";
import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const MARKDOWN_FILE_PATTERN = /\.md(?:#[^\s)]*)?$/i;

/** POSIX dirname without the Node `path` module (keeps this module client-bundle safe). */
function posixDirname(path: string): string {
  const lastSlash = path.lastIndexOf("/");

  if (lastSlash < 0) {
    return ".";
  }

  if (lastSlash === 0) {
    return "/";
  }

  return path.slice(0, lastSlash);
}

/** POSIX normalize for forward-slash repo paths: resolves "." and ".." segments. */
function posixNormalize(path: string): string {
  const isAbsolute = path.startsWith("/");
  const segments = path.split("/");
  const resolved: string[] = [];

  for (const segment of segments) {
    if (segment.length === 0 || segment === ".") {
      continue;
    }

    if (segment === "..") {
      if (resolved.length > 0 && resolved[resolved.length - 1] !== "..") {
        resolved.pop();
      } else if (!isAbsolute) {
        resolved.push("..");
      }

      continue;
    }

    resolved.push(segment);
  }

  const joined = resolved.join("/");

  if (isAbsolute) {
    return `/${joined}`;
  }

  return joined.length > 0 ? joined : ".";
}

/**
 * Architect-facing link labels for legacy OPERATOR_* repo filenames (filenames unchanged on disk).
 */
const HELP_LINK_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  operator_atlas: "Workspace route map",
  operator_decision_guide: "Deployment decision guide",
  first_pilot_operator_path: "First-pilot workspace runbook",
  operator_quickstart: "Getting started",
  operator_troubleshooting: "Troubleshooting",
  operator_admin_diagnostics: "Admin diagnostics",
  operator_shell_tutorial: "Workspace tutorial",
  first_hour_operator_path: "Your first architecture review",
  core_pilot: "Your first architecture review",
  complete_review_workflow: "Your first architecture review",
};

/**
 * Turns repo filenames like `OPERATOR_ATLAS.md` into help link labels (no extension).
 */
export function humanizeMarkdownFileReference(pathOrName: string): string {
  const withoutFragment = pathOrName.split("#")[0] ?? pathOrName;
  const baseName = withoutFragment.split("/").pop() ?? withoutFragment;
  const withoutExtension = baseName.replace(/\.md$/i, "");
  const overrideKey = withoutExtension.replace(/-/g, "_").toLowerCase();
  const override = HELP_LINK_LABEL_OVERRIDES[overrideKey];

  if (override !== undefined) {
    return override;
  }

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

  const sourceDir = posixDirname(sourceDocPath.replace(/^\//, ""));
  const joined = posixNormalize(`${sourceDir}/${hrefPath}`);

  return joined.replace(/^\//, "");
}

/**
 * Rewrites internal markdown links to in-app `/help/{slug}` routes or plain labels.
 */
function canonicalizeInAppOperatorHref(href: string): string {
  const hashIndex = href.indexOf("#");
  const beforeHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const fragment = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const queryIndex = beforeHash.indexOf("?");
  const pathPart = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
  const canonical = canonicalizeLegacyOperatorRoutePath(pathPart);

  if (canonical.includes("?")) {
    return `${canonical}${fragment}`;
  }

  return `${canonical}${query}${fragment}`;
}

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

    if (trimmedHref.startsWith("#")) {
      return `[${humanizeMarkdownLinkLabel(label, trimmedHref)}](${trimmedHref})`;
    }

    if (trimmedHref.startsWith("/") && !trimmedHref.startsWith("//")) {
      const canonicalHref = canonicalizeInAppOperatorHref(trimmedHref);

      return `[${humanizeMarkdownLinkLabel(label, trimmedHref)}](${canonicalHref})`;
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
