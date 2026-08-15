import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { ProcurementHelpEvidenceOrientationStrip } from "@/components/help/ProcurementHelpEvidenceOrientationStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
import {
  PROCUREMENT_HELP_JOB_MATRIX,
  PROCUREMENT_HELP_JOB_MATRIX_HEADING,
  PROCUREMENT_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/procurement-help-ia-dual";
import {
  PROCUREMENT_HELP_RELATED_HEADING,
  PROCUREMENT_HELP_RELATED_TEST_ID,
  procurementHelpRelatedGuides,
} from "@/lib/procurement-help-related-guides";
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
  const relatedGuides = procurementHelpRelatedGuides();

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

      <section
        aria-labelledby="help-procurement-job-matrix-heading"
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid={PROCUREMENT_HELP_JOB_MATRIX_TEST_ID}
      >
        <h2
          id="help-procurement-job-matrix-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {PROCUREMENT_HELP_JOB_MATRIX_HEADING}
        </h2>
        <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {PROCUREMENT_HELP_JOB_MATRIX.map((row) => (
            <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              {row.isCurrent === true ? (
                <span
                  className="shrink-0 font-medium text-al-text-primary"
                  data-testid="help-procurement-job-matrix-current"
                >
                  {row.label}
                </span>
              ) : (
                <Link className={cn(OPERATOR_LINK.inline, "shrink-0 font-medium")} href={row.href ?? "#"}>
                  {row.label}
                </Link>
              )}
              <span className="text-al-text-secondary">{row.when}</span>
            </li>
          ))}
        </ul>
      </section>

      <HelpTopicExportClaimDiscipline claimDiscipline={PROCUREMENT_HELP_CLAIM_DISCIPLINE} />

      <ProcurementHelpEvidenceOrientationStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
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

          <section
            aria-labelledby="help-procurement-related-heading"
            className="space-y-2 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid={PROCUREMENT_HELP_RELATED_TEST_ID}
          >
            <h2
              id="help-procurement-related-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {PROCUREMENT_HELP_RELATED_HEADING}
            </h2>
            <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {relatedGuides.map((guide) => (
                <li key={guide.href}>
                  <Link
                    href={guide.href}
                    className={cn(
                      "underline-offset-2 hover:underline",
                      DESIGN_TOKENS.accent.link,
                      OPERATOR_LINK.inline,
                    )}
                  >
                    {guide.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
