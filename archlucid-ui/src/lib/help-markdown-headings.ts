import { createHelpHeadingSlugAllocator } from "@/lib/help-heading-slug";

export type HelpMarkdownHeading = {
  readonly level: 2 | 3;
  readonly id: string;
  readonly title: string;
};

/**
 * Extracts `##` / `###` headings for in-page TOC (slug rules match help search index + markdown renderer).
 */
export function extractHelpMarkdownHeadings(markdown: string): readonly HelpMarkdownHeading[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const allocateSectionSlug = createHelpHeadingSlugAllocator();
  const headings: HelpMarkdownHeading[] = [];

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("###")) {
      const title = line.slice(3).trim();

      if (title.length > 0) {
        headings.push({ level: 2, id: allocateSectionSlug(title), title });
      }

      continue;
    }

    if (line.startsWith("### ")) {
      const title = line.slice(4).trim();

      if (title.length > 0) {
        headings.push({ level: 3, id: allocateSectionSlug(title), title });
      }
    }
  }

  return headings;
}
