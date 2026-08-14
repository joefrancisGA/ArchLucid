import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SearchReviewEvidenceHelpEvidenceOrientationStrip } from "@/components/help/SearchReviewEvidenceHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL } from "@/lib/search-review-evidence-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_HELP_CANONICAL_PATH } from "@/lib/search-review-evidence-help-evidence-copy";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_BREADCRUMB_TOPIC_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS,
  SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS,
  SEARCH_REVIEW_EVIDENCE_HELP_HIT_ANATOMY_FIELDS,
  SEARCH_REVIEW_EVIDENCE_HELP_HOW_TO_READ_STEPS,
  SEARCH_REVIEW_EVIDENCE_HELP_INDEXED_ROWS,
  SEARCH_REVIEW_EVIDENCE_HELP_OVERVIEW,
  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_EYEBROW,
  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_PRECONDITION,
  SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION,
  SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_SECTION_ID,
  SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_TITLE,
} from "@/lib/search-review-evidence-help-guide-content";
import { cn } from "@/lib/utils";

type HelpSearchReviewEvidenceGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

/** Operator search orientation for `/help/search-review-evidence`. */
export function HelpSearchReviewEvidenceGuideView(
  props: HelpSearchReviewEvidenceGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-search-review-evidence-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        eyebrow={SEARCH_REVIEW_EVIDENCE_HELP_PAGE_EYEBROW}
        title={SEARCH_REVIEW_EVIDENCE_HELP_PAGE_TITLE}
        titleTestId="help-search-review-evidence-page-title"
        subtitle={SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE}
        navHref={SEARCH_REVIEW_EVIDENCE_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={SEARCH_REVIEW_EVIDENCE_HELP_BREADCRUMB_TOPIC_TITLE} />}
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-search-review-evidence-overview">
            {SEARCH_REVIEW_EVIDENCE_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-search-review-evidence-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION.href}>
                  {SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-search-review-evidence-precondition"
              >
                {SEARCH_REVIEW_EVIDENCE_HELP_PRECONDITION}
              </p>
            </CardContent>
          </Card>

          <section
            aria-labelledby={SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_SECTION_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_SECTION_ID}>
              {SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_TITLE}
            </HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-search-review-evidence-indexed-rows"
            >
              {SEARCH_REVIEW_EVIDENCE_HELP_INDEXED_ROWS.map((row) => (
                <div key={row.term}>
                  <dt className="font-medium text-al-text-primary">{row.term}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{row.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="what-search-review-evidence-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-search-review-evidence-shows">
              What search review evidence shows
            </HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-search-review-evidence-feature-items"
            >
              {SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">
                    {item.href === undefined ? (
                      item.label
                    ) : (
                      <Link className={OPERATOR_LINK.nav} href={item.href}>
                        {item.label}
                      </Link>
                    )}
                  </dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-search-review-evidence-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-search-review-evidence-works">
              {SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL}
            </HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-search-review-evidence-how-stepper"
            >
              {SEARCH_REVIEW_EVIDENCE_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-search-review-evidence-hit-anatomy"
            >
              {SEARCH_REVIEW_EVIDENCE_HELP_HIT_ANATOMY_FIELDS.map((field) => (
                <div key={field.label}>
                  <dt className="font-medium text-al-text-primary">{field.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{field.description}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <SearchReviewEvidenceHelpEvidenceOrientationStrip />
          </div>
        </div>

        <HelpTopicTableOfContents headings={SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
