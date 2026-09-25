import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceFooter } from "@/components/help/HelpTopicRegistryProvenanceFooter";
import { HelpTopicRegistrySourcesDisclosure } from "@/components/help/HelpTopicRegistrySourcesDisclosure";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SECURITY_EVIDENCE_PATHS_HELP_BREADCRUMB_TOPIC_TITLE,
  SECURITY_EVIDENCE_PATHS_HELP_CLAIM_DISCIPLINE,
  SECURITY_EVIDENCE_PATHS_HELP_PAGE_SUBTITLE,
  SECURITY_EVIDENCE_PATHS_HELP_PAGE_TITLE,
  SECURITY_EVIDENCE_PATHS_HELP_PATH,
  SECURITY_EVIDENCE_PATHS_HELP_PRIMARY_ACTION,
  SECURITY_EVIDENCE_PATHS_HELP_PRIMARY_CONTENT_ID,
  SECURITY_EVIDENCE_PATHS_HELP_RELATED_ACTION,
  SECURITY_EVIDENCE_PATHS_HELP_SKIP_LINK_LABEL,
} from "@/lib/security-evidence-paths-help-guide-content";
import { cn } from "@/lib/utils";

type HelpSecurityEvidencePathsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** SecureNow path inspect orientation for `/help/security-evidence-paths` (HE2). */
export function HelpSecurityEvidencePathsGuideView(
  props: HelpSecurityEvidencePathsGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-security-evidence-paths-guide"
    >
      <a
        href={`#${SECURITY_EVIDENCE_PATHS_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {SECURITY_EVIDENCE_PATHS_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicBreadcrumb topicTitle={SECURITY_EVIDENCE_PATHS_HELP_BREADCRUMB_TOPIC_TITLE} />

      <HelpTopicGuidePageHeader
        title={SECURITY_EVIDENCE_PATHS_HELP_PAGE_TITLE}
        titleTestId="help-security-evidence-paths-page-title"
        subtitle={SECURITY_EVIDENCE_PATHS_HELP_PAGE_SUBTITLE}
        navHref={SECURITY_EVIDENCE_PATHS_HELP_PATH}
        headingLevel="h1"
        claimDiscipline={SECURITY_EVIDENCE_PATHS_HELP_CLAIM_DISCIPLINE}
        claimDisciplineTestId="help-security-evidence-paths-claim-discipline"
        metadata={
          <div className="space-y-2" data-testid="help-security-evidence-paths-header-metadata">
            <HelpTopicRegistrySourcesDisclosure entry={entry} />
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div id={SECURITY_EVIDENCE_PATHS_HELP_PRIMARY_CONTENT_ID} className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          {showSectionNav ? <HelpTopicTableOfContents headings={headings} placement="header-inline" /> : null}

          <MarketingAccessibilityMarkdownFragment
            markdownBody={preparedMarkdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
            preparedMarkdownOverride={preparedMarkdown}
          />

          <section aria-labelledby="where-to-go-next" className="space-y-3">
            <h2 id="where-to-go-next" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Where to go next</h2>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={SECURITY_EVIDENCE_PATHS_HELP_PRIMARY_ACTION.href}>
                  {SECURITY_EVIDENCE_PATHS_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={SECURITY_EVIDENCE_PATHS_HELP_RELATED_ACTION.href}>
                  {SECURITY_EVIDENCE_PATHS_HELP_RELATED_ACTION.label}
                </Link>
              </Button>
            </div>
          </section>

          <HelpTopicRegistryProvenanceFooter entry={entry} />
        </div>
      </div>
    </article>
  );
}
