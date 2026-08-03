import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE,
  FIRST_VALUE_20_HELP_JOB_MATRIX,
  FIRST_VALUE_20_HELP_ORIENTATION,
  FIRST_VALUE_20_HELP_OVERVIEW,
  FIRST_VALUE_20_HELP_PAGE_SUBTITLE,
  FIRST_VALUE_20_HELP_PAGE_TITLE,
  FIRST_VALUE_20_HELP_PRIMARY_ACTIONS,
  FIRST_VALUE_20_HELP_SOURCES,
} from "@/lib/first-value-20-help-guide-content";
import { FIRST_VALUE_20_HELP_PATH } from "@/lib/first-value-20-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpFirstValue20GuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin/SE time-boxed first-value orientation for `/help/first-value-20-minutes` (HEF / TB-1691–TB-1695). */
export function HelpFirstValue20GuideView(props: HelpFirstValue20GuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-first-value-20-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={FIRST_VALUE_20_HELP_PAGE_TITLE}
        titleTestId="help-first-value-20-page-title"
        subtitle={FIRST_VALUE_20_HELP_PAGE_SUBTITLE}
        navHref={FIRST_VALUE_20_HELP_PATH}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-first-value-20-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-first-value-20-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Prefer customer paths first
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary" data-testid="help-first-value-20-primary-cta">
              <Link href={FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openBuyerFirstReview.href}>
                {FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openBuyerFirstReview.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.startArchitectureReview.href}>
                {FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.startArchitectureReview.label}
              </Link>
            </Button>
            <Link
              href={FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openTroubleshooting.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openTroubleshooting.label}
            </Link>
          </CardContent>
        </Card>

        <section
          className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
          aria-labelledby="help-first-value-20-sources-heading"
          data-testid="help-first-value-20-sources"
        >
          <h2
            id="help-first-value-20-sources-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            Related guides
          </h2>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Send customers to the buyer guides; keep this Admin time box for SE proof collection.
          </p>
          <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
            {FIRST_VALUE_20_HELP_SOURCES.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn, "max-w-[42rem] lg:max-w-none")}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-first-value-20-overview">
          {FIRST_VALUE_20_HELP_OVERVIEW}
        </p>

        <section
          aria-labelledby="help-first-value-20-orientation-heading"
          data-testid="help-first-value-20-orientation"
        >
          <h2
            id="help-first-value-20-orientation-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            20-minute orientation
          </h2>
          <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {FIRST_VALUE_20_HELP_ORIENTATION.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="help-first-value-20-job-matrix-heading"
          data-testid="help-first-value-20-job-matrix"
        >
          <h2
            id="help-first-value-20-job-matrix-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Which first-value guide?
          </h2>
          <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {FIRST_VALUE_20_HELP_JOB_MATRIX.map((row) => (
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
          data-testid="help-first-value-20-claim-discipline"
        >
          <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h2>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE}</p>
        </aside>

        <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-first-value-20-content">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={preparedMarkdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
          />
        </div>
      </div>
    </article>
  );
}
