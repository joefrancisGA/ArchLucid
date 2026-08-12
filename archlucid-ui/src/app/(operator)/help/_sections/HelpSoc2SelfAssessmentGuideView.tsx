import Link from "next/link";

import { HelpSoc2SelfAssessmentHeaderMetadata } from "@/app/(operator)/help/_sections/HelpSoc2SelfAssessmentHeaderMetadata";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE,
  SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX,
  SOC2_SELF_ASSESSMENT_HELP_ORIENTATION,
  SOC2_SELF_ASSESSMENT_HELP_OVERVIEW,
  SOC2_SELF_ASSESSMENT_HELP_PAGE_SUBTITLE,
  SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE,
  SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS,
  SOC2_SELF_ASSESSMENT_HELP_SOURCES,
  SOC2_SELF_ASSESSMENT_HELP_SOURCES_INTRO,
} from "@/lib/soc2-self-assessment-help-guide-content";
import { SOC2_SELF_ASSESSMENT_HELP_PATH } from "@/lib/soc2-self-assessment-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpSoc2SelfAssessmentGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer SOC 2 self-assessment orientation for `/help/soc2-self-assessment` (TB-1746 / TB-1749 / TB-1750). */
export function HelpSoc2SelfAssessmentGuideView(
  props: HelpSoc2SelfAssessmentGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-soc2-self-assessment-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE}
        titleTestId="help-soc2-self-assessment-page-title"
        subtitle={SOC2_SELF_ASSESSMENT_HELP_PAGE_SUBTITLE}
        navHref={SOC2_SELF_ASSESSMENT_HELP_PATH}
        metadata={<HelpSoc2SelfAssessmentHeaderMetadata entry={entry} />}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-soc2-self-assessment-header-actions"
          >
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-soc2-self-assessment-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Continue assurance diligence
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary" data-testid="help-soc2-self-assessment-primary-cta">
              <Link href={SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openTrustCenter.href}>
                {SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openTrustCenter.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openCaiqSig.href}>
                {SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openCaiqSig.label}
              </Link>
            </Button>
            <Link
              href={SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openProcurement.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openProcurement.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-soc2-self-assessment-overview">
            {SOC2_SELF_ASSESSMENT_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="help-soc2-self-assessment-orientation-heading"
            data-testid="help-soc2-self-assessment-orientation"
          >
            <h2
              id="help-soc2-self-assessment-orientation-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              How to use this self-assessment
            </h2>
            <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {SOC2_SELF_ASSESSMENT_HELP_ORIENTATION.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="help-soc2-self-assessment-job-matrix-heading"
            data-testid="help-soc2-self-assessment-job-matrix"
          >
            <h2
              id="help-soc2-self-assessment-job-matrix-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Which diligence artifact?
            </h2>
            <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX.map((row) => (
                <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                  {row.href !== undefined ? (
                    <Link className={cn(OPERATOR_LINK.inline, "font-medium shrink-0")} href={row.href}>
                      {row.label}
                    </Link>
                  ) : (
                    <span className="font-medium shrink-0 text-al-text-primary">{row.label}</span>
                  )}
                  <span className="text-al-text-secondary">{row.when}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
            aria-labelledby="help-soc2-self-assessment-sources-heading"
            data-testid="help-soc2-self-assessment-sources"
          >
            <h2
              id="help-soc2-self-assessment-sources-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
            >
              {HELP_DILIGENCE_ARTIFACT_INDEX_TITLE}
            </h2>
            <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {SOC2_SELF_ASSESSMENT_HELP_SOURCES_INTRO}
            </p>
            <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {SOC2_SELF_ASSESSMENT_HELP_SOURCES.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <aside
            className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
            data-testid="help-soc2-self-assessment-claim-discipline"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Self-assessment only
            </h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
              {SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE}
            </p>
          </aside>

          <div
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-soc2-self-assessment-content"
          >
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
