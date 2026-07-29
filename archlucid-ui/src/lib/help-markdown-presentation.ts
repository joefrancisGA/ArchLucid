import { tryResolveInAppDocHref } from "@/lib/in-app-doc-href";
import { capitalizeInlineGuidanceBody, parseLeadingInlineGuidanceLabel } from "@/lib/inline-guidance-labels";
import { applyHelpTopicProductLanguage } from "@/lib/help-product-language";

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
  first_hour_operator_path: "First-review guide",
  core_pilot: "Your first architecture review",
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

/** Removes HTML comments from markdown before operator-facing help render. */
export function stripHtmlComments(markdown: string): string {
  let result = "";
  let cursor = 0;

  while (cursor < markdown.length) {
    const open = markdown.indexOf("<!--", cursor);

    if (open === -1) {
      result += markdown.slice(cursor);
      break;
    }

    result += markdown.slice(cursor, open);
    const close = markdown.indexOf("-->", open + 4);

    if (close === -1) {
      result += markdown.slice(open);
      break;
    }

    cursor = close + 3;
  }

  return result;
}

/** Drops contributor-only sections that must not appear in buyer help topics. */
export function stripInternalBuyerHelpSections(markdown: string): string {
  const internalSectionPrefixes = ["trust progression timeline", "automated freshness posture"] as const;
  const lines = markdown.split("\n");
  const result: string[] = [];
  let omitSection = false;

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("###")) {
      const title = line.slice(3).trim().toLowerCase();
      omitSection = internalSectionPrefixes.some((prefix) => title.startsWith(prefix));
    }

    if (!omitSection) {
      result.push(line);
    }
  }

  return result.join("\n");
}

/** Removes internal enablement preamble lines from buyer FAQ sources. */
export function stripInternalBuyerHelpPreamble(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => !/\*\*Canonical assurance wording:\*\*/i.test(line))
    .filter((line) => !/\*\*SIG \/ CAIQ row acceleration:\*\*/i.test(line))
    .filter((line) => !/scripts\/ci\//i.test(line))
    .filter((line) => !/Tenant\.DataRegion/i.test(line))
    .join("\n");
}

/** Strips inline CI and backlog references from buyer help copy. */
export function stripInternalBuyerHelpInlineReferences(markdown: string): string {
  return markdown
    .replace(/\(`scripts\/ci\/[^`)]+`\)/gi, "")
    .replace(/`scripts\/ci\/[^`]+`/gi, "")
    .replace(/\[([^\]]*)\]\(https:\/\/github\.com\/joefrancisGA\/ArchLucid\/blob\/main\/[^)]+\)/gi, "$1")
    .replace(/`V1_DEFERRED\.md`/gi, "deferred program documentation")
    .replace(/V1_DEFERRED\.md/gi, "deferred program documentation")
    .replace(/Deferred assurance and packaging \(V1_DEFERRED\)/gi, "Deferred assurance and packaging")
    .replace(/\(V1_DEFERRED\)/gi, "")
    .replace(/V1_DEFERRED/gi, "deferred program")
    .replace(/V1\.1-program/gi, "future program")
    .replace(/`Tenant\.DataRegion`/gi, "tenant data region");
}

/**
 * TB-1254 — removes contributor path/CLI/improvement-ID leakage that can remain after
 * link rewrite (procurement FAQ and similar buyer packets).
 */
export function stripProcurementContributorLeakage(markdown: string): string {
  return markdown
    .replace(/Improvement archived\s*\*?\*?#?\d+\*?\*?/gi, "")
    .replace(/`?archlucid auth(?:\s+validate-saml)?`?/gi, "IdP federation validation")
    .replace(/`?V1_SCOPE\.md`?/gi, "V1 product scope")
    .replace(/V1_SCOPE\.md/gi, "V1 product scope")
    .replace(/`?CONFIGURATION_REFERENCE\.md`?/gi, "configuration documentation")
    .replace(/CONFIGURATION_REFERENCE\.md/gi, "configuration documentation")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/contributor-reference\/SECURITY\.md/gi, "security documentation")
    .replace(/`?PENDING_QUESTIONS\.md`?/gi, "owner diligence notes")
    .replace(/PENDING_QUESTIONS\.md/gi, "owner diligence notes")
    .replace(/infra\/terraform-entra\/?/gi, "hosted identity samples")
    .replace(/`infra\/`/gi, "hosted infrastructure")
    .replace(/\binfra\//gi, "hosted infrastructure ")
    .replace(/ArtifactLargePayload:[A-Za-z0-9]+/g, "regional storage configuration")
    .replace(/TenantProvisioning:[A-Za-z0-9]+/g, "tenant provisioning configuration")
    .replace(/dbo\.Tenants(?:\.[A-Za-z0-9_]+)?/gi, "tenant residency settings")
    .replace(/ArchLucidAuth:[A-Za-z0-9]+/g, "authentication configuration")
    .replace(/Order Form Addendum [A-Z]/gi, "Order Form addendum")
    .replace(/MSA_TEMPLATE\.md/gi, "MSA template")
    .replace(/ORDER_FORM_TEMPLATE\.md/gi, "Order Form template")
    .replace(/CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE\.md/gi, "SoW template")
    .replace(/PRICING_PHILOSOPHY\.md/gi, "pricing documentation")
    .replace(/SLA_SUMMARY\.md/gi, "SLA summary")
    .replace(/SLA_TARGETS\.md/gi, "SLA targets");
}

/** H2 sections omitted from in-app configuration reference (contributor / marketing / test-only). */
const CONFIGURATION_REFERENCE_OMITTED_SECTION_PREFIXES = [
  "testing (non-production)",
  "public marketing site",
] as const;

/**
 * TB-1327 — drops Testing / marketing-build sections from the product configuration help view.
 */
export function stripConfigurationReferenceContributorSections(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let omitSection = false;

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("###")) {
      const title = line.slice(3).trim().toLowerCase();
      omitSection = CONFIGURATION_REFERENCE_OMITTED_SECTION_PREFIXES.some((prefix) =>
        title.startsWith(prefix),
      );
    }

    if (!omitSection) {
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * TB-1327 — removes backlog IDs, RC script/fixture paths, ADR deep links, and contributor
 * security/scope anchors from in-app configuration reference presentation.
 */
export function stripConfigurationReferenceContributorLeakage(markdown: string): string {
  let inFence = false;

  const withoutSensitiveRows = markdown
    .split("\n")
    .filter((line) => {
      const trimmedStart = line.trimStart();

      if (trimmedStart.startsWith("```")) {
        inFence = !inFence;
        return true;
      }

      if (inFence) {
        return true;
      }

      if (/AllowRlsBypass/i.test(line)) {
        return false;
      }

      if (/InternalCrossTenantAnalytics/i.test(line)) {
        return false;
      }

      if (/\*\*Release-candidate gates/i.test(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  return withoutSensitiveRows
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/\[ADR\s+\d+\]\([^)]+\)/gi, "production secrets guidance")
    .replace(/\bADR\s+\d+\b/gi, "production secrets guidance")
    .replace(/docs\/architecture\/adrs\/[^\s)]+/gi, "architecture guidance")
    .replace(/`?scripts\/[^`\s)]+`?/gi, "release readiness checks")
    .replace(/\bscripts\/[^\s)]+/gi, "release readiness checks")
    .replace(/`?fixtures\/release-candidate\/[^`\s)]*`?/gi, "release-candidate baseline config")
    .replace(/fixtures\/release-candidate\/[^\s)]*/gi, "release-candidate baseline config")
    .replace(/`?artifacts\/release-readiness\/[^`\s)]*`?/gi, "release readiness evidence")
    .replace(/artifacts\/release-readiness\/[^\s)]*/gi, "release readiness evidence")
    .replace(/\[([^\]]*)\]\(contributor-reference\/SECURITY\.md\)/gi, "security documentation")
    .replace(/contributor-reference\/SECURITY\.md/gi, "security documentation")
    .replace(/contributor-reference\//gi, "")
    .replace(/\[([^\]]*)\]\(V1_SCOPE\.md[^)]*\)/gi, "V1 product scope")
    .replace(/`?V1_SCOPE\.md`?/gi, "V1 product scope")
    .replace(/docs\/library\/V1_SCOPE\.md/gi, "V1 product scope")
    .replace(/\[([^\]]*)\]\([^)]*SECURITY\.md\)/gi, "security documentation")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/PUBLIC_MARKETING_SITE_TOPOLOGY\.md/gi, "marketing site topology")
    .replace(/`?\.\\scripts\\[^`\s]+`?/gi, "prerequisite validation")
    .replace(/\.\\scripts\\[^\s)]+/gi, "prerequisite validation")
    .replace(/\n{3,}/g, "\n\n");
}

/** Emphasizes known inline guidance labels in help markdown when not already bold. */
export function emphasizeInlineGuidanceLabels(markdown: string): string {
  let inFence = false;

  return markdown
    .split("\n")
    .map((line) => {
      const trimmedFence = line.trimStart();

      if (trimmedFence.startsWith("```")) {
        inFence = !inFence;
        return line;
      }

      if (inFence) {
        return line;
      }

      const prefixMatch = /^(\s*(?:[-*]|\d+\.)\s+|>\s*)/.exec(line);
      const prefix = prefixMatch?.[1] ?? "";
      const rest = prefixMatch !== undefined && prefixMatch !== null ? line.slice(prefix.length) : line;
      const restTrimmed = rest.trimStart();

      if (restTrimmed.startsWith("**")) {
        return line;
      }

      const parsed = parseLeadingInlineGuidanceLabel(restTrimmed);

      if (parsed === null) {
        return line;
      }

      const restLeadingWhitespace = rest.slice(0, rest.length - restTrimmed.length);

      const body = capitalizeInlineGuidanceBody(parsed.label, parsed.body);

      return `${prefix}${restLeadingWhitespace}**${parsed.label}** ${body}`;
    })
    .join("\n");
}

/** Markdown horizontal rules used as section dividers — not rendered in in-app help. */
const MARKDOWN_HORIZONTAL_RULE_LINE = /^(\*{3,}|-{3,}|_{3,})\s*$/;

/**
 * Removes `---` / `***` / `___` thematic-break lines from help markdown (preserves fenced code blocks).
 */
export function stripMarkdownHorizontalRules(markdown: string): string {
  let inFence = false;

  const lines = markdown.split("\n").filter((line) => {
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
      return true;
    }

    if (inFence) {
      return true;
    }

    return !MARKDOWN_HORIZONTAL_RULE_LINE.test(line.trim());
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

export type PrepareHelpMarkdownPresentationOptions = {
  /** Engineering runbooks keep documentation governance lines (Last reviewed, etc.). */
  readonly preserveMaintenanceMetadata?: boolean;
};

/** Documentation governance lines stripped from buyer/operator help presentation. */
const HELP_DOCUMENTATION_MAINTENANCE_LINE_PATTERNS: readonly RegExp[] = [
  /^\s*(?:>\s*)?(?:[-*]\s+)?(?:\*\*)?(?:Last reviewed|Last updated|Maintained by|Doc owner)(?:\*\*)?:\s*.+$/i,
  /^\s*(?:>\s*)?(?:[-*]\s+)?(?:\*\*)?Owner(?:\*\*)?:\s*.+$/i,
] as const;

export function isDocumentationMaintenanceMetadataLine(line: string): boolean {
  const trimmed = line.trim();

  if (trimmed.length === 0 || trimmed.startsWith("|")) {
    return false;
  }

  return HELP_DOCUMENTATION_MAINTENANCE_LINE_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * Removes wiki-style maintenance metadata lines from help markdown (source files unchanged on disk).
 */
export function stripDocumentationMaintenanceMetadata(markdown: string): string {
  let inFence = false;

  const lines = markdown.split("\n").filter((line) => {
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
      return true;
    }

    if (inFence) {
      return true;
    }

    return !isDocumentationMaintenanceMetadataLine(line);
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

/**
 * Prepares repo markdown for in-app help rendering — no raw `.md` paths in operator UI.
 */
export function prepareHelpMarkdownForPresentation(
  markdown: string,
  sourceDocPath: string,
  options?: PrepareHelpMarkdownPresentationOptions,
): string {
  const withoutPreamble = stripLeadingContributorScopeBlockquote(markdown);
  const withoutInternalPreamble = stripInternalBuyerHelpPreamble(withoutPreamble);
  const normalized = stripDuplicateMarkdownTitle(stripInternalEngineeringBatchLabels(withoutInternalPreamble));
  const withoutHtmlComments = stripHtmlComments(normalized);
  const withoutInternalSections = stripInternalBuyerHelpSections(withoutHtmlComments);
  const withoutInlineReferences = stripInternalBuyerHelpInlineReferences(withoutInternalSections);
  const normalizedSourcePath = sourceDocPath.replace(/\\/g, "/").toLowerCase();
  const isConfigurationReference = normalizedSourcePath.includes("configuration_reference.md");
  const beforeLinkRewrite = isConfigurationReference
    ? stripConfigurationReferenceContributorSections(withoutInlineReferences)
    : withoutInlineReferences;
  const rewrittenLinks = rewriteHelpMarkdownDocLinks(beforeLinkRewrite, sourceDocPath);
  const sanitized = sanitizeBareMarkdownFileReferences(rewrittenLinks);
  // Audience-specific strips — do not apply procurement/config rewrites to unrelated topics.
  let afterAudienceStrip = sanitized;

  if (normalizedSourcePath.includes("buyer_security_procurement_packet.md")) {
    afterAudienceStrip = stripProcurementContributorLeakage(sanitized);
  } else if (isConfigurationReference) {
    afterAudienceStrip = stripConfigurationReferenceContributorLeakage(sanitized);
  }

  const withoutHorizontalRules = stripMarkdownHorizontalRules(afterAudienceStrip);
  const presentationBody =
    options?.preserveMaintenanceMetadata === true
      ? withoutHorizontalRules
      : stripDocumentationMaintenanceMetadata(withoutHorizontalRules);

  return applyHelpTopicProductLanguage(emphasizeInlineGuidanceLabels(presentationBody));
}
