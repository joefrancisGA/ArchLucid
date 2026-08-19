import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";

export const PROCUREMENT_HELP_PATH = "/help/procurement" as const;

export const PROCUREMENT_HELP_PAGE_TITLE = "Procurement FAQ";

export const PROCUREMENT_HELP_PAGE_SUBTITLE =
  "Buyer-safe answers for InfoSec questionnaires, resilience reviews, and enterprise procurement diligence.";

export function formatProcurementHelpProvenanceLine(entry: ProductDocumentationEntry): string | null {
  const sourcePath = entry.sourcePaths[0];

  if (sourcePath === undefined || sourcePath.trim().length === 0) {
    return null;
  }

  const segments = sourcePath.trim().replace(/\\/g, "/").split("/");
  const fileName = segments[segments.length - 1];

  if (fileName === undefined || fileName.length === 0) {
    return null;
  }

  return `Source: ${fileName}`;
}

export function prepareProcurementHelpBodyMarkdown(markdown: string): string {
  const start = markdown.indexOf("## Q & A");

  if (start < 0) {
    return markdown.trim();
  }

  const faqSection = markdown.slice(start);

  return stripMarkdownSectionsByTitlePrefix(faqSection, ["trust progression timeline"], {
    collapseBlankLines: true,
  }).trim();
}
