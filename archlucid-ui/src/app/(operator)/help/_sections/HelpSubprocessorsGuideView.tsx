import Link from "next/link";

import { HelpSubprocessorsHeaderMetadata } from "@/app/(operator)/help/_sections/HelpSubprocessorsHeaderMetadata";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { SubprocessorsHelpEvidenceOrientationStrip } from "@/components/help/SubprocessorsHelpEvidenceOrientationStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SUBPROCESSORS_HELP_JOB_MATRIX,
  SUBPROCESSORS_HELP_JOB_MATRIX_HEADING,
  SUBPROCESSORS_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/subprocessors-help-ia-dual";
import {
  SUBPROCESSORS_HELP_OVERVIEW,
  SUBPROCESSORS_HELP_PAGE_SUBTITLE,
  SUBPROCESSORS_HELP_PAGE_TITLE,
  SUBPROCESSORS_HELP_PATH,
  SUBPROCESSORS_HELP_PRIMARY_ACTIONS,
} from "@/lib/subprocessors-help-guide-content";
import {
  SUBPROCESSORS_HELP_RELATED_HEADING,
} from "@/lib/subprocessors-help-evidence-copy";
import {
  SUBPROCESSORS_HELP_RELATED_TEST_ID,
  subprocessorsHelpRelatedGuides,
} from "@/lib/subprocessors-help-related-guides";
import { cn } from "@/lib/utils";

type HelpSubprocessorsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer subprocessors register orientation for `/help/subprocessors` (TB-1751 / TB-1753 / TB-1754). */
export function HelpSubprocessorsGuideView(
  props: HelpSubprocessorsGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const relatedGuides = subprocessorsHelpRelatedGuides();

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-subprocessors-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={SUBPROCESSORS_HELP_PAGE_TITLE}
        titleTestId="help-subprocessors-page-title"
        subtitle={SUBPROCESSORS_HELP_PAGE_SUBTITLE}
        navHref={SUBPROCESSORS_HELP_PATH}
        headingLevel="h1"
        metadata={<HelpSubprocessorsHeaderMetadata entry={entry} />}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-subprocessors-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card data-testid="help-subprocessors-action-panel">
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Continue diligence
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button
              asChild
              size="sm"
              variant="primary"
              data-testid={SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openTrustCenter.testId}
            >
              <Link href={SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openTrustCenter.href}>
                {SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openTrustCenter.label}
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              data-testid={SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openDpaTemplate.testId}
            >
              <Link href={SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openDpaTemplate.href}>
                {SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openDpaTemplate.label}
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              data-testid={SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openSecurityTrust.testId}
            >
              <Link href={SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openSecurityTrust.href}>
                {SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openSecurityTrust.label}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <SubprocessorsHelpEvidenceOrientationStrip />

      <section
        aria-labelledby="help-subprocessors-job-matrix-heading"
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid={SUBPROCESSORS_HELP_JOB_MATRIX_TEST_ID}
      >
        <h2
          id="help-subprocessors-job-matrix-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {SUBPROCESSORS_HELP_JOB_MATRIX_HEADING}
        </h2>
        <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {SUBPROCESSORS_HELP_JOB_MATRIX.map((row) => (
            <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              {row.isCurrent === true ? (
                <span
                  className="shrink-0 font-medium text-al-text-primary"
                  data-testid="help-subprocessors-job-matrix-current"
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

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-subprocessors-overview">
            {SUBPROCESSORS_HELP_OVERVIEW}
          </p>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-subprocessors-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={preparedMarkdown}
              tableCaption={`${entry.title} register table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>

          <section
            aria-labelledby="help-subprocessors-related-heading"
            className="space-y-2 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid={SUBPROCESSORS_HELP_RELATED_TEST_ID}
          >
            <h2
              id="help-subprocessors-related-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {SUBPROCESSORS_HELP_RELATED_HEADING}
            </h2>
            <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {relatedGuides.map((guide) => (
                <li key={guide.href}>
                  <Link
                    href={guide.href}
                    className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link, OPERATOR_LINK.inline)}
                  >
                    {guide.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
