/**
 * Stable heading slugs for in-app help deep links (must match `scripts/build-help-search-index.mjs`).
 */
export function stripInlineMarkdownForSlug(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
}

export type ParsedHelpMarkdownHeading = {
  readonly title: string;
  readonly explicitAnchor: string | null;
};

/** Strips trailing `{#anchor}` tags from markdown headings while preserving the anchor for deep links. */
export function parseHelpMarkdownHeading(rawTitle: string): ParsedHelpMarkdownHeading {
  const explicitAnchorMatch = rawTitle.match(/\s*\{#([^}]+)\}\s*$/);

  if (explicitAnchorMatch !== null) {
    const explicitAnchor = explicitAnchorMatch[1]?.trim().toLowerCase() ?? null;
    const title = rawTitle.replace(/\s*\{#([^}]+)\}\s*$/, "").trim();

    return { title, explicitAnchor };
  }

  return { title: rawTitle.trim(), explicitAnchor: null };
}

export function resolveHelpHeadingId(
  rawTitle: string,
  allocateSectionSlug: (heading: string) => string,
): { readonly id: string; readonly title: string } {
  const { title, explicitAnchor } = parseHelpMarkdownHeading(rawTitle);
  const id = explicitAnchor ?? allocateSectionSlug(title);

  return { id, title };
}

export function slugifyHelpHeading(heading: string): string {
  const cleaned = stripInlineMarkdownForSlug(heading)
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return cleaned.length > 0 ? cleaned : "section";
}

/** Allocates unique slugs per document (duplicates get `-2`, `-3`, …). */
export function createHelpHeadingSlugAllocator(): (headingRaw: string) => string {
  const slugUseCount = new Map<string, number>();

  return (headingRaw: string): string => {
    const baseSlug = slugifyHelpHeading(headingRaw);
    const next = (slugUseCount.get(baseSlug) ?? 0) + 1;
    slugUseCount.set(baseSlug, next);

    return next === 1 ? baseSlug : `${baseSlug}-${next}`;
  };
}
