import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpProcurementSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpProcurementSourcesOrientationStrip";
import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { ProcurementHelpClaimDisciplineStrip } from "@/components/help/ProcurementHelpClaimDisciplineStrip";
import { ProcurementHelpDiligenceCtaSection } from "@/components/help/ProcurementHelpDiligenceCtaSection";
import { ProcurementHelpEvidenceOrientationStrip } from "@/components/help/ProcurementHelpEvidenceOrientationStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import {
  PROCUREMENT_HELP_CLAIM_DISCIPLINE,
} from "@/lib/procurement-help-evidence-copy";
import {
  formatProcurementHelpProvenanceLine,
  prepareProcurementHelpBodyMarkdown,
  PROCUREMENT_HELP_PAGE_SUBTITLE,
  PROCUREMENT_HELP_PAGE_TITLE,
  PROCUREMENT_HELP_PATH,
} from "@/lib/procurement-help-guide-content";
import {
  PROCUREMENT_HELP_BUYER_OVERVIEW,
  PROCUREMENT_HELP_FIRST_VIEWPORT_TEST_ID,
  PROCUREMENT_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  PROCUREMENT_HELP_PAGE_LEAD,
  PROCUREMENT_HELP_PAGE_SUBTITLE_BUYER,
  PROCUREMENT_HELP_PRIMARY_CONTENT_ID,
  PROCUREMENT_HELP_SKIP_LINK_LABEL,
  PROCUREMENT_HELP_SKIP_TARGET_ID,
  PROCUREMENT_HELP_START_HERE_HELPER,
} from "@/lib/procurement-help-page-copy";
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

function procurementHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? PROCUREMENT_HELP_PAGE_SUBTITLE_BUYER : PROCUREMENT_HELP_PAGE_SUBTITLE;
}

function ProcurementHelpJobMatrixSection(): React.ReactElement {
  return (
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
  );
}

/** Buyer procurement FAQ specialty view for `/help/procurement` (TB-1253). */
export function HelpProcurementGuideView(props: HelpProcurementGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const bodyMarkdown = prepareProcurementHelpBodyMarkdown(markdown);
  const preparedMarkdown = prepareHelpMarkdownForPresentation(bodyMarkdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const showSectionNav = !buyerPolishedShell && headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(showSectionNav ? headings.length : 0);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const provenanceLine = formatProcurementHelpProvenanceLine(entry);
  const relatedGuides = procurementHelpRelatedGuides();

  const pageBody = (
    <>
      <OperatorPageHeader
        title={PROCUREMENT_HELP_PAGE_TITLE}
        titleTestId="help-procurement-page-title"
        subtitle={procurementHelpPageSubtitle(buyerPolishedShell)}
        subtitleClassName="max-w-3xl"
        navHref={PROCUREMENT_HELP_PATH}
        headingLevel="h1"
        claimDiscipline={buyerPolishedShell ? PROCUREMENT_HELP_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId={buyerPolishedShell ? PROCUREMENT_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined}
        metadata={
          buyerPolishedShell || provenanceLine === null ? null : (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
              data-testid="help-procurement-provenance"
            >
              {provenanceLine}
            </p>
          )
        }
        actions={
          buyerPolishedShell ? undefined : (
            <div className="flex flex-wrap items-center gap-2" data-testid="help-procurement-header-actions">
              <PageContextualHelpButton />
              <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
            </div>
          )
        }
      />

      {buyerPolishedShell ? null : <ProcurementHelpClaimDisciplineStrip />}

      {buyerPolishedShell ? (
        <div
          id={PROCUREMENT_HELP_SKIP_TARGET_ID}
          data-testid={PROCUREMENT_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <div className="space-y-4" data-testid="help-procurement-buyer-intro">
            <p className={readingBodyClass} data-testid="help-procurement-intro">
              {PROCUREMENT_HELP_PAGE_LEAD}
            </p>
          </div>
          <ProcurementHelpJobMatrixSection />
          <ProcurementHelpDiligenceCtaSection />
          <p
            className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="help-procurement-start-here-helper"
          >
            {PROCUREMENT_HELP_START_HERE_HELPER}
          </p>
        </div>
      ) : (
        <ProcurementHelpJobMatrixSection />
      )}

      {buyerPolishedShell ? (
        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-procurement-overview"
        >
          {PROCUREMENT_HELP_BUYER_OVERVIEW}
        </p>
      ) : null}

      {buyerPolishedShell ? null : (
        <HelpTopicExportClaimDiscipline claimDiscipline={PROCUREMENT_HELP_CLAIM_DISCIPLINE} />
      )}

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
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

          {buyerPolishedShell ? null : (
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
          )}

          {buyerPolishedShell ? null : <ProcurementHelpEvidenceOrientationStrip />}
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
      </div>

      {buyerPolishedShell ? <HelpProcurementSourcesOrientationStrip /> : null}
    </>
  );

  return (
    <article
      className={cn(operatorPageContainerClass("dashboard"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-procurement-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${PROCUREMENT_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {PROCUREMENT_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      {buyerPolishedShell ? (
        <div
          id={PROCUREMENT_HELP_PRIMARY_CONTENT_ID}
          data-testid={PROCUREMENT_HELP_PRIMARY_CONTENT_ID}
          className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
        >
          {pageBody}
        </div>
      ) : (
        pageBody
      )}
    </article>
  );
}
