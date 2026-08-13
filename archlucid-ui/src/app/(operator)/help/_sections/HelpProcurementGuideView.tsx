import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { ProcurementHelpEvidenceOrientationStrip } from "@/components/help/ProcurementHelpEvidenceOrientationStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { PROCUREMENT_HELP_CLAIM_DISCIPLINE } from "@/lib/procurement-help-evidence-copy";
import {
  formatProcurementHelpProvenanceLine,
  prepareProcurementHelpBodyMarkdown,
  PROCUREMENT_HELP_PAGE_SUBTITLE,
  PROCUREMENT_HELP_PAGE_TITLE,
  PROCUREMENT_HELP_PATH,
} from "@/lib/procurement-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpProcurementGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer procurement FAQ specialty view for `/help/procurement` (TB-1253). */
export function HelpProcurementGuideView(props: HelpProcurementGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const bodyMarkdown = prepareProcurementHelpBodyMarkdown(markdown);
  const preparedMarkdown = prepareHelpMarkdownForPresentation(bodyMarkdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const provenanceLine = formatProcurementHelpProvenanceLine(entry);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[90rem]")}
      data-testid="help-procurement-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={PROCUREMENT_HELP_PAGE_TITLE}
        titleTestId="help-procurement-page-title"
        subtitle={PROCUREMENT_HELP_PAGE_SUBTITLE}
        navHref={PROCUREMENT_HELP_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-procurement-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: PROCUREMENT_HELP_PAGE_TITLE }]}
          />
        }
        metadata={
          provenanceLine === null ? null : (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
              data-testid="help-procurement-provenance"
            >
              {provenanceLine}
            </p>
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-procurement-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
          </div>
        }
      />

      <HelpTopicExportClaimDiscipline claimDiscipline={PROCUREMENT_HELP_CLAIM_DISCIPLINE} />

      <ProcurementHelpEvidenceOrientationStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-procurement-faq-content">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={bodyMarkdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
            preparedMarkdownOverride={preparedMarkdown}
          />
        </div>

        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
