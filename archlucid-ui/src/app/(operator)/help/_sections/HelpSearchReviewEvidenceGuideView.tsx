"use client";

import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SearchReviewEvidenceHelpClaimDisciplineStrip } from "@/components/help/SearchReviewEvidenceHelpClaimDisciplineStrip";
import { SearchReviewEvidenceHelpEvidenceOrientationStrip } from "@/components/help/SearchReviewEvidenceHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
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
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID,
  SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS,
  SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS,
  SEARCH_REVIEW_EVIDENCE_HELP_HIT_ANATOMY_FIELDS,
  SEARCH_REVIEW_EVIDENCE_HELP_HOW_TO_READ_STEPS,
  SEARCH_REVIEW_EVIDENCE_HELP_INDEXED_ROWS,
  SEARCH_REVIEW_EVIDENCE_HELP_OVERVIEW,
  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_EYEBROW,
  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_PRECONDITION,
  SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION,
  SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_CONTENT_ID,
  SEARCH_REVIEW_EVIDENCE_HELP_SKIP_LINK_LABEL,
  SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_SECTION_ID,
  SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_TITLE,
  searchReviewEvidenceHelpPageSubtitle,
} from "@/lib/search-review-evidence-help-guide-content";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

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
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-search-review-evidence",
    SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS,
    SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-search-review-evidence-guide"
    >
      <a
        href={`#${SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {SEARCH_REVIEW_EVIDENCE_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : SEARCH_REVIEW_EVIDENCE_HELP_PAGE_EYEBROW}
        title={SEARCH_REVIEW_EVIDENCE_HELP_PAGE_TITLE}
        titleTestId="help-search-review-evidence-page-title"
        subtitle={searchReviewEvidenceHelpPageSubtitle(buyerPolishedShell)}
        navHref={SEARCH_REVIEW_EVIDENCE_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <SearchReviewEvidenceHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div
          id={SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <div data-testid="help-search-review-evidence-orientation-top">
            <SearchReviewEvidenceHelpEvidenceOrientationStrip />
          </div>

          <p className={readingBodyClass} data-testid="help-search-review-evidence-overview">
            {SEARCH_REVIEW_EVIDENCE_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-search-review-evidence-action-panel"
            aria-labelledby="help-search-review-evidence-action-panel-heading"
          >
            <h2
              id="help-search-review-evidence-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE}
            </h2>
            <Button asChild size="sm" variant="primary">
              <Link href={SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION.href}>
                {SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION.label}
              </Link>
            </Button>
            <p
              className={cn("m-0 text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-search-review-evidence-precondition"
            >
              {SEARCH_REVIEW_EVIDENCE_HELP_PRECONDITION}
            </p>
          </section>

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
        </div>

        <HelpTopicTableOfContents headings={guideHeadings} />
      </div>
    </article>
  );
}
