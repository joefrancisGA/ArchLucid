import "server-only";

import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";

import {
  parsePrivacyPolicyMetadata,
  preparePrivacyPolicyBodyMarkdown,
  resolvePrivacyPolicyQuickNavLinks,
  resolvePrivacyPolicyRelatedDocuments,
  type PrivacyPolicyPreparedContent,
} from "@/lib/privacy-policy-content";
import { readPrivacyPolicyMarkdown } from "@/lib/privacy-policy-marketing";

export type { PrivacyPolicyPreparedContent };

export function preparePrivacyPolicyContent(): PrivacyPolicyPreparedContent {
  const markdown = readPrivacyPolicyMarkdown();
  const metadata = parsePrivacyPolicyMetadata(markdown);
  const bodyMarkdown = preparePrivacyPolicyBodyMarkdown(markdown);
  const headings = extractHelpMarkdownHeadings(bodyMarkdown);
  const quickNavLinks = resolvePrivacyPolicyQuickNavLinks(headings);
  const relatedDocuments = resolvePrivacyPolicyRelatedDocuments(headings);

  return {
    metadata,
    bodyMarkdown,
    headings,
    quickNavLinks,
    relatedDocuments,
  };
}
