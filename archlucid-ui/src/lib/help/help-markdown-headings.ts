import { createHelpHeadingSlugAllocator, resolveHelpHeadingId } from "@/lib/help/help-heading-slug";

export type HelpMarkdownHeading = {
  readonly level: 2 | 3;
  readonly id: string;
  readonly title: string;
};

/**
 * Extracts `##` / `###` headings for in-page TOC (slug rules match help search index + markdown renderer).
 * Headings inside `<details>` blocks are excluded so advanced sections stay out of the sidebar TOC.
 */
export function extractHelpMarkdownHeadings(markdown: string): readonly HelpMarkdownHeading[] {
  const withoutDetails = markdown.replace(/<details[\s\S]*?<\/details>/gi, "");
  const lines = withoutDetails.replace(/\r\n/g, "\n").split("\n");
  const allocateSectionSlug = createHelpHeadingSlugAllocator();
  const headings: HelpMarkdownHeading[] = [];

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("###")) {
      const rawTitle = line.slice(3).trim();
      const resolved = resolveHelpHeadingId(rawTitle, allocateSectionSlug);

      if (resolved.title.length > 0) {
        headings.push({ level: 2, id: resolved.id, title: resolved.title });
      }

      continue;
    }

    if (line.startsWith("### ")) {
      const rawTitle = line.slice(4).trim();
      const resolved = resolveHelpHeadingId(rawTitle, allocateSectionSlug);

      if (resolved.title.length > 0) {
        headings.push({ level: 3, id: resolved.id, title: resolved.title });
      }
    }
  }

  return headings;
}
