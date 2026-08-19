import {
  applyHelpMarkdownPresentationRules,
  applyHelpMarkdownTopicRules,
  type HelpMarkdownTopicContext,
} from "@/lib/help/help-markdown-presentation-pipeline";
import { applyHelpTopicProductLanguage } from "@/lib/help/help-product-language";
import { rewriteProcurementFaqBuyerPresentation } from "@/lib/procurement-help-presentation";

import {
  stripInternalBuyerHelpInlineReferences,
  stripInternalBuyerHelpPreamble,
  stripInternalBuyerHelpSections,
  stripInternalEngineeringBatchLabels,
  stripDuplicateMarkdownTitle,
  stripHtmlComments,
  stripLeadingContributorScopeBlockquote,
  stripProductReleaseVersionLabels,
} from "./markdown-cleanup";
import {
  rewriteHelpMarkdownDocLinks,
  sanitizeBareMarkdownFileReferences,
} from "./link-rewrites";
import {
  emphasizeInlineGuidanceLabels,
  stripMarkdownHorizontalRules,
} from "./presentation-polish";
import {
  HELP_MARKDOWN_AUDIENCE_RULE_SETS,
  HELP_MARKDOWN_CONTRIBUTOR_SECTION_RULE_SETS,
  HELP_MARKDOWN_SOURCE_PRESTAGE_RULE_SETS,
  resolveDuplicateSectionTitles,
} from "./topic-rule-sets";
import { stripSponsorReportPilotRoiMeasurementLeakage, stripTenantIsolationContributorLeakage, alignDataHandlingIsolationHonesty } from "./contributor-leakage";
import { finalizeSecurityTrustHelpPresentation } from "@/lib/security-trust-help-presentation";

export type PrepareHelpMarkdownPresentationOptions = {
  /** Engineering runbooks keep documentation governance lines (Last reviewed, etc.). */
  readonly preserveMaintenanceMetadata?: boolean;
  /** In-app help topic slug — gates topic-specific presentation strips. */
  readonly helpTopicSlug?: string;
};

/** Documentation governance lines stripped from buyer/operator help presentation. */
const HELP_DOCUMENTATION_MAINTENANCE_LINE_PATTERNS: readonly RegExp[] = [
  /^\s*(?:>\s*)?(?:[-*]\s+)?(?:\*\*)?(?:Last reviewed(?:\s*\(UTC\))?|Last updated|Maintained by|Doc owner)(?:\*\*)?:\s*.+$/i,
  /^\s*(?:>\s*)?(?:[-*]\s+)?(?:\*\*)?Owner(?:\*\*)?:\s*.+$/i,
] as const;

export function isDocumentationMaintenanceMetadataLine(line: string): boolean {
  const trimmed = line.trim();

  if (trimmed.length === 0 || trimmed.startsWith("|")) {
    return false;
  }

  return HELP_DOCUMENTATION_MAINTENANCE_LINE_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * Removes wiki-style maintenance metadata lines from help markdown (source files unchanged on disk).
 */
export function stripDocumentationMaintenanceMetadata(markdown: string): string {
  let inFence = false;

  const lines = markdown.split("\n").filter((line) => {
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
      return true;
    }

    if (inFence) {
      return true;
    }

    return !isDocumentationMaintenanceMetadataLine(line);
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}


export function prepareHelpMarkdownForPresentation(
  markdown: string,
  sourceDocPath: string,
  options?: PrepareHelpMarkdownPresentationOptions,
): string {
  const withoutInternalPreamble = applyHelpMarkdownPresentationRules(markdown, [
    stripLeadingContributorScopeBlockquote,
    stripInternalBuyerHelpPreamble,
  ]);
  const duplicateSectionTitles = resolveDuplicateSectionTitles(options?.helpTopicSlug);
  const normalized = stripDuplicateMarkdownTitle(stripInternalEngineeringBatchLabels(withoutInternalPreamble), {
    duplicateSectionTitles,
  });
  const withoutInlineReferences = applyHelpMarkdownPresentationRules(normalized, [
    stripHtmlComments,
    stripInternalBuyerHelpSections,
    stripInternalBuyerHelpInlineReferences,
  ]);
  const topicContext: HelpMarkdownTopicContext = {
    helpTopicSlug: options?.helpTopicSlug,
    normalizedSourcePath: sourceDocPath.replace(/\\/g, "/").toLowerCase(),
  };
  const beforeLinkRewrite = applyHelpMarkdownTopicRules(
    applyHelpMarkdownTopicRules(
      withoutInlineReferences,
      HELP_MARKDOWN_SOURCE_PRESTAGE_RULE_SETS,
      topicContext,
    ),
    HELP_MARKDOWN_CONTRIBUTOR_SECTION_RULE_SETS,
    topicContext,
  );
  const sanitized = sanitizeBareMarkdownFileReferences(
    rewriteHelpMarkdownDocLinks(beforeLinkRewrite, sourceDocPath),
  );
  const afterAudienceStrip = applyHelpMarkdownTopicRules(
    sanitized,
    HELP_MARKDOWN_AUDIENCE_RULE_SETS,
    topicContext,
  );
  const withoutHorizontalRules = applyHelpMarkdownPresentationRules(afterAudienceStrip, [
    alignDataHandlingIsolationHonesty,
    stripTenantIsolationContributorLeakage,
    stripMarkdownHorizontalRules,
  ]);
  const presentationBody =
    options?.preserveMaintenanceMetadata === true
      ? withoutHorizontalRules
      : stripDocumentationMaintenanceMetadata(withoutHorizontalRules);

  let finalBody = applyHelpMarkdownPresentationRules(presentationBody, [
    emphasizeInlineGuidanceLabels,
    applyHelpTopicProductLanguage,
    stripProductReleaseVersionLabels,
  ]);

  if (options?.helpTopicSlug === "sponsor-report") {
    finalBody = stripSponsorReportPilotRoiMeasurementLeakage(finalBody);
  }

  if (options?.helpTopicSlug === "procurement") {
    finalBody = rewriteProcurementFaqBuyerPresentation(finalBody);
  }

  if (options?.helpTopicSlug === "security-trust") {
    finalBody = finalizeSecurityTrustHelpPresentation(finalBody);
  }

  return finalBody;
}
