import {
  stripDuplicateMarkdownTitle,
  stripLeadingContributorScopeBlockquote,
} from "@/lib/help-markdown/markdown-cleanup";
import { sanitizeBareMarkdownFileReferences } from "@/lib/help-markdown/link-rewrites";
import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";

/** Removes markdown link targets that still point at repo `.md` files after section strips. */
function stripMarkdownDocLinkTargets(text: string): string {
  let result = text.replace(
    /\[([^\]]+)\]\(([^)]*\.md(?:#[^)]*)?)\)/gi,
    (_match, label: string) => label.trim(),
  );

  result = result.replace(/\([^)]*\.md[^)]*\)/gi, "");

  return result;
}

/** Replaces internal engineering labels that read like repository artefacts on buyer surfaces. */
function replaceInternalEngineeringLabels(text: string): string {
  return text.replace(/`SyntheticCaseStudyDataProvider`/g, "synthetic sponsor metrics");
}

/** Buyer-facing synthetic bulletin — strips repo preamble, duplicate title, and internal links. */
export function prepareExampleRoiBulletinMarkdownForBuyer(markdown: string): string {
  let result = markdown;

  result = stripLeadingContributorScopeBlockquote(result);
  result = stripDuplicateMarkdownTitle(result);
  result = stripMarkdownSectionsByTitlePrefix(result, ["related"]);
  result = stripMarkdownDocLinkTargets(result);
  result = replaceInternalEngineeringLabels(result);
  result = sanitizeBareMarkdownFileReferences(result);

  return result.trim();
}
