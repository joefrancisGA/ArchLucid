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
import {
  REVIEW_PACKAGES_HELP_OVERVIEW,
  REVIEW_PACKAGES_HELP_PAGE_SUBTITLE,
  REVIEW_PACKAGES_HELP_PAGE_TITLE,
  REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS,
  REVIEW_PACKAGES_HELP_RELATED,
} from "@/lib/review-packages-help-guide-content";
import { REVIEW_PACKAGES_HELP_PATH } from "@/lib/review-packages-help-route";
import { cn } from "@/lib/utils";

type HelpReviewPackagesGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Specialty Architecture reviews companion for `/help/review-packages` (TB-1399). */
export function HelpReviewPackagesGuideView(props: HelpReviewPackagesGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-review-packages-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={REVIEW_PACKAGES_HELP_PAGE_TITLE}
        titleTestId="help-review-packages-page-title"
        subtitle={REVIEW_PACKAGES_HELP_PAGE_SUBTITLE}
        navHref={REVIEW_PACKAGES_HELP_PATH}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-review-packages-header-actions"
          >
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-review-packages-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Browse architecture reviews
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link
                href={REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.openReviews.href}
                data-testid="help-review-packages-open-reviews"
              >
                {REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.openReviews.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.startAReview.href}>
                {REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.startAReview.label}
              </Link>
            </Button>
            <Link
              href={REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.findingsGuide.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.findingsGuide.label}
            </Link>
          </CardContent>
        </Card>

        <section
          className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
          aria-labelledby="help-review-packages-related-heading"
          data-testid="help-review-packages-related"
        >
          <h2
            id="help-review-packages-related-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            Related guides
          </h2>
          <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
            {REVIEW_PACKAGES_HELP_RELATED.map((link) => (
              <li key={link.href}>
                <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-review-packages-overview">
            {REVIEW_PACKAGES_HELP_OVERVIEW}
          </p>

          <div
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-review-packages-content"
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
