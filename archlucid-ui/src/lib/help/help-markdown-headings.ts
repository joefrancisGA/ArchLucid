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

export const HELP_CLAIM_DISCIPLINE_DEFAULT_HEADING = "What this guide does not cover" as const;

export const HELP_FOLLOW_UPS_DEFAULT_TITLE = "Where to go next" as const;

/** Appends claim-discipline and follow-up TOC rows when markdown guides omit them. */
export function appendHelpClaimDisciplineTocHeadings(
  headings: readonly HelpMarkdownHeading[],
  claimHeadingId: string,
  claimHeadingTitle: string = HELP_CLAIM_DISCIPLINE_DEFAULT_HEADING,
  followUpsTitle: string = HELP_FOLLOW_UPS_DEFAULT_TITLE,
): readonly HelpMarkdownHeading[] {
  const result: HelpMarkdownHeading[] = [...headings];
  const claimExists = headings.some((heading) => heading.id === claimHeadingId);
  const followUpsExists = headings.some((heading) => heading.id === "where-to-go-next");

  if (!claimExists) {
    result.push({ level: 2, id: claimHeadingId, title: claimHeadingTitle });
  }

  if (!followUpsExists) {
    result.push({ level: 2, id: "where-to-go-next", title: followUpsTitle });
  }

  return result;
}
