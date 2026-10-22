import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";

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

export type StripDuplicateMarkdownTitleOptions = {
  /** Section headings (`## Title {#anchor}`) matching these titles are removed after H1 dedupe. */
  readonly duplicateSectionTitles?: readonly string[];
};

/**
 * Drops the first markdown H1 — the help shell already renders `entry.title` in the page header.
 * When `duplicateSectionTitles` is set, also drops a leading anchored `##` whose title matches.
 */
export function stripDuplicateMarkdownTitle(
  markdown: string,
  options?: StripDuplicateMarkdownTitleOptions,
): string {
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length && (lines[index] ?? "").trim().length === 0) {
    index++;
  }

  const first = lines[index] ?? "";

  if (first.startsWith("# ") && !first.startsWith("## ")) {
    index++;

    while (index < lines.length && (lines[index] ?? "").trim().length === 0) {
      index++;
    }
  }

  const duplicateTitles = new Set(
    (options?.duplicateSectionTitles ?? [])
      .map((title) => title.trim().toLowerCase())
      .filter((title) => title.length > 0),
  );

  if (duplicateTitles.size > 0) {
    const sectionHeading = lines[index] ?? "";
    const anchoredHeadingMatch = sectionHeading.match(/^##\s+(.+?)\s*\{#([^}]+)\}\s*$/);

    if (anchoredHeadingMatch !== null) {
      const headingTitle = anchoredHeadingMatch[1]?.trim().toLowerCase() ?? "";

      if (duplicateTitles.has(headingTitle)) {
        index++;

        while (index < lines.length && (lines[index] ?? "").trim().length === 0) {
          index++;
        }
      }
    }
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

  return stripMarkdownSectionsByTitlePrefix(markdown, internalSectionPrefixes);
}

const INTERNAL_BUYER_HELP_LINE_PATTERNS: ReadonlyArray<RegExp> = [
  /\*\*Canonical assurance wording:\*\*/i,
  /\*\*SIG \/ CAIQ row acceleration:\*\*/i,
  /scripts\/ci\//i,
  /Tenant\.DataRegion/i,
];

function shouldStripInternalBuyerHelpLine(line: string): boolean {
  return INTERNAL_BUYER_HELP_LINE_PATTERNS.some((pattern) => pattern.test(line));
}

/** Drops empty fenced code blocks left after line-level stripping. */
export function removeEmptyFencedCodeBlocks(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceBuffer: string[] = [];

  const flushFence = (): void => {
    if (fenceBuffer.length === 0) {
      return;
    }

    const hasBody = fenceBuffer.slice(1).some((bufferedLine) => bufferedLine.trim().length > 0);

    if (hasBody) {
      for (const bufferedLine of fenceBuffer) {
        result.push(bufferedLine);
      }
    }

    fenceBuffer = [];
  };

  for (const line of lines) {
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      if (inFence) {
        fenceBuffer.push(line);
        flushFence();
        inFence = false;
        continue;
      }

      inFence = true;
      fenceBuffer = [line];
      continue;
    }

    if (inFence) {
      fenceBuffer.push(line);
      continue;
    }

    result.push(line);
  }

  if (inFence) {
    flushFence();
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Removes internal enablement preamble lines from buyer FAQ sources (fence-aware). */
export function stripInternalBuyerHelpPreamble(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceBuffer: string[] = [];
  let omitFence = false;

  const flushFence = (): void => {
    if (fenceBuffer.length === 0) {
      return;
    }

    if (!omitFence) {
      for (const bufferedLine of fenceBuffer) {
        result.push(bufferedLine);
      }
    }

    fenceBuffer = [];
    omitFence = false;
  };

  for (const line of lines) {
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      if (inFence) {
        fenceBuffer.push(line);
        flushFence();
        inFence = false;
        continue;
      }

      inFence = true;
      fenceBuffer = [line];
      omitFence = shouldStripInternalBuyerHelpLine(line);
      continue;
    }

    if (inFence) {
      fenceBuffer.push(line);

      if (shouldStripInternalBuyerHelpLine(line)) {
        omitFence = true;
      }

      continue;
    }

    if (!shouldStripInternalBuyerHelpLine(line)) {
      result.push(line);
    }
  }

  if (inFence) {
    flushFence();
  }

  return removeEmptyFencedCodeBlocks(result.join("\n"));
}

/** Strips product release window labels and internal version shorthand from buyer-visible help copy. */
export function stripProductReleaseVersionLabels(markdown: string): string {
  return markdown
    .replace(/\*\*\[V1 GA[^\]]*\]\*\*/gi, "**[first-party]**")
    .replace(/\[V1 GA[^\]]*\]/gi, "first-party")
    .replace(/\bV1 GA first-party\b/gi, "first-party")
    .replace(/\bV1 GA\b/gi, "generally available")
    .replace(/\bV1\.1 customer-operated\b/gi, "customer-operated")
    .replace(/\bV1\.1 recipe bridge\b/gi, "recipe bridge")
    .replace(/\bV1\.1\b/gi, "future release")
    .replace(/\bV1-ready\b/gi, "product-ready")
    .replace(/\bV1 pilots?\b/gi, "pilots")
    .replace(/\bfirst-pilot V1\b/gi, "first-pilot")
    .replace(/\bshipped V1\b/gi, "shipped")
    .replace(/\bStatus:\s*V1 GA\b/gi, "Status: generally available")
    .replace(/\bNot V1-required\b/gi, "Not required for pilots")
    .replace(/\bnot V1 defects\b/gi, "not product defects")
    .replace(/\bout of V1\b/gi, "out of current scope")
    .replace(/\bdo not promise GA in V1 pilots\b/gi, "do not promise GA in pilots")
    .replace(/\bUse \(V1\)\b/g, "Use")
    .replace(/\bV1-only\b/gi, "product")
    .replace(/\bV1 REST\b/gi, "REST")
    .replace(/\bV1 vs V1\.1\b/gi, "current product vs future release")
    .replace(/\bV1 window\b/gi, "current product window")
    .replace(/\binternal V1 rollout\b/gi, "internal rollout")
    .replace(/\bV1 scope\b/gi, "product scope")
    .replace(/\bV1 ships\b/gi, "ArchLucid ships")
    .replace(/\bV1 includes\b/gi, "ArchLucid includes")
    .replace(/\bV1 offers\b/gi, "ArchLucid offers")
    .replace(/\bV1 uses\b/gi, "ArchLucid uses")
    .replace(/\bV1 professional services\b/gi, "Professional services")
    .replace(/\bV1 GA —/gi, "")
    .replace(/\bRoadmap \/ V1\.1\b/gi, "Roadmap")
    .replace(/\bGTM V1\.1\b/gi, "GTM")
    .replace(/\bThree lanes \(V1 default\)/gi, "Three lanes")
    .replace(/##\s*V1\s+scalability/gi, "## Scalability")
    .replace(/#v1-scalability-and-load-evidence/gi, "#scalability-and-load-evidence")
    .replace(/\{#v1-scalability-and-load-evidence\}/gi, "{#scalability-and-load-evidence}")
    .replace(/\{#v1-/gi, "{#")
    .replace(/\bV1\s+scalability\b/gi, "scalability")
    .replace(/\bActive\s+V1\s+control\b/gi, "Active control")
    .replace(/\bnot\s+V1\s+blockers\b/gi, "not product blockers")
    .replace(/\b\(V1 evidence today\)/gi, "(current evidence)")
    .replace(/\bV1\s+evidence\b/gi, "current evidence")
    .replace(/\bdefault\s+V1\s+path\b/gi, "default path")
    .replace(/\bnot\s+a\s+single-switch\s+V1\s+guarantee\b/gi, "not a single-switch product guarantee")
    .replace(/\bAuthoritative\s+V1\b/gi, "Authoritative product")
    .replace(/\bthe\s+\*\*V1\*\*\s+contract\b/gi, "the product contract")
    .replace(/\bV1\s+assurance\b/gi, "current assurance")
    .replace(/\bV1\s+posture\b/gi, "product posture")
    .replace(/\bfor\s+V1\b/gi, "for the product")
    .replace(/\bin\s+V1\b/gi, "in the product")
    .replace(/\bV1\s+describes\b/gi, "ArchLucid describes")
    .replace(/\bnot\s+a\s+V1\s+guarantee\b/gi, "not a product guarantee")
    .replace(/\bV1\s+surface\b/gi, "product surface")
    .replace(/\bV1\s+registry\b/gi, "product registry")
    .replace(/\bV1\s+readiness\b/gi, "product readiness")
    .replace(/\bV1\s+objections\b/gi, "procurement objections")
    .replace(/\bV1\s+claims\b/gi, "product claims")
    .replace(/\bV1\s+required\b/gi, "product-required")
    .replace(/\bV1\s+storage\b/gi, "current storage")
    .replace(/\bV1\s+exposes\b/gi, "ArchLucid exposes")
    .replace(/\bYes\s+—\s+V1\b/gi, "Yes")
    .replace(/\*\*V1:\*\*/gi, "**Current product posture:**")
    .replace(/\*\*V1\*\* assurance/gi, "**Current** assurance")
    .replace(/\bV1\b/g, "ArchLucid");
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
