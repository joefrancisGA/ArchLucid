/**
 * Stable heading slugs for in-app help deep links (must match `scripts/build-help-search-index.mjs`).
 */
export function stripInlineMarkdownForSlug(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
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
