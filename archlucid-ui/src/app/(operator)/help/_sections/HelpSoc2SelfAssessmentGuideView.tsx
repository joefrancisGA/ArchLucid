import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE,
  SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX,
  SOC2_SELF_ASSESSMENT_HELP_ORIENTATION,
  SOC2_SELF_ASSESSMENT_HELP_OVERVIEW,
  SOC2_SELF_ASSESSMENT_HELP_PAGE_SUBTITLE,
  SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE,
  SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS,
} from "@/lib/soc2-self-assessment-help-guide-content";
import { SOC2_SELF_ASSESSMENT_HELP_PATH } from "@/lib/soc2-self-assessment-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
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
                  <Link className={cn(OPERATOR_LINK.inline, "font-medium shrink-0")} href={row.href}>
                    {row.label}
                  </Link>
                  <span className="text-al-text-secondary">{row.when}</span>
                </li>
              ))}
            </ul>
          </section>

          <aside
            className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
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
