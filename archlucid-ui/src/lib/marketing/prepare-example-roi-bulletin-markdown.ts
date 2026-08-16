import {
  stripDuplicateMarkdownTitle,
  stripLeadingContributorScopeBlockquote,
} from "@/lib/help-markdown/markdown-cleanup";
import { sanitizeBareMarkdownFileReferences } from "@/lib/help-markdown/link-rewrites";
import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";

/** Buyer-facing synthetic bulletin — strips repo preamble, duplicate title, and internal links. */
export function prepareExampleRoiBulletinMarkdownForBuyer(markdown: string): string {
  let result = markdown;

  result = stripLeadingContributorScopeBlockquote(result);
  result = stripDuplicateMarkdownTitle(result);
  result = stripMarkdownSectionsByTitlePrefix(result, ["related"]);
  result = sanitizeBareMarkdownFileReferences(result);

  return result.trim();
}
