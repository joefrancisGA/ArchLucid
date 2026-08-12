import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { ReviewGuideHelpHeaderAsOfLine } from "@/components/help/ReviewGuideHelpHeaderAsOfLine";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  prepareReviewPackagesHelpBodyMarkdown,
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
  const bodyMarkdown = prepareReviewPackagesHelpBodyMarkdown(markdown);
  const preparedMarkdown = prepareHelpMarkdownForPresentation(bodyMarkdown, sourceDocPath, {
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
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-review-packages-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: REVIEW_PACKAGES_HELP_PAGE_TITLE }]}
          />
        }
        metadata={
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
            data-testid="help-review-packages-header-metadata"
          >
            <ReviewGuideHelpHeaderAsOfLine entry={entry} />
          </div>
        }
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-review-packages-header-actions"
          >
            <Button
              asChild
              size="sm"
              variant="primary"
              className="min-h-6 min-w-6"
            >
              <Link
                href={REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.openReviews.href}
                data-testid="help-review-packages-open-reviews"
              >
                {REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.openReviews.label}
              </Link>
            </Button>
            <span
              className="mx-1 hidden h-5 w-px bg-neutral-300 sm:inline-block dark:bg-neutral-700"
              aria-hidden="true"
            />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

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
              <Link
                className={cn(
                  OPERATOR_LINK.inline,
                  "inline-flex min-h-6 min-w-6 items-center font-medium underline underline-offset-2",
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
              markdownBody={bodyMarkdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>

          <div
            className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-review-packages-footer-actions"
          >
            <Button asChild size="sm" variant="primary" className="min-h-6 min-w-6">
              <Link
                href={REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.openReviews.href}
                data-testid="help-review-packages-open-reviews-footer"
              >
                {REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.openReviews.label}
              </Link>
            </Button>
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
