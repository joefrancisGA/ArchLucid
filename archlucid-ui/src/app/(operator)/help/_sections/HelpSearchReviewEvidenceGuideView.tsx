import Link from "next/link";



import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";

import { SearchReviewEvidenceHelpEvidenceOrientationStrip } from "@/components/help/SearchReviewEvidenceHelpEvidenceOrientationStrip";

import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";

import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";

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

  SEARCH_REVIEW_EVIDENCE_HELP_ASK_HREF,

  SEARCH_REVIEW_EVIDENCE_HELP_EVIDENCE_GRAPH_HREF,

  SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS,

  SEARCH_REVIEW_EVIDENCE_HELP_FINDINGS_HREF,

  SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS,

  SEARCH_REVIEW_EVIDENCE_HELP_HOW_TO_READ_STEPS,

  SEARCH_REVIEW_EVIDENCE_HELP_OVERVIEW,

  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE,

  SEARCH_REVIEW_EVIDENCE_HELP_PAGE_TITLE,

  SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION,

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



  return (

    <article

      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}

      data-testid="help-search-review-evidence-guide"

    >

      <HelpTopicHashScroll />



      <OperatorPageHeader

        title={SEARCH_REVIEW_EVIDENCE_HELP_PAGE_TITLE}

        titleTestId="help-search-review-evidence-page-title"

        subtitle={SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE}

        navHref={SEARCH_REVIEW_EVIDENCE_HELP_CANONICAL_PATH}

        headingLevel="h1"


        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}

        actions={<PageContextualHelpButton />}

      />



      <div className={contentGridClass}>

        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>

          <p

            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}

            data-testid="help-search-review-evidence-overview"

          >

            {SEARCH_REVIEW_EVIDENCE_HELP_OVERVIEW}

          </p>



          <Card

            className="border-neutral-200 dark:border-neutral-800"

            data-testid="help-search-review-evidence-action-panel"

          >

            <CardHeader className={OPERATOR_CARD.header}>

              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open search</CardTitle>

            </CardHeader>

            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>

              <Button asChild size="sm" variant="primary">

                <Link href={SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION.href}>

                  {SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION.label}

                </Link>

              </Button>

            </CardContent>

          </Card>



          <section

            aria-labelledby="what-search-review-evidence-shows"

            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"

          >

            <HelpSectionHeading id="what-search-review-evidence-shows">

              What search review evidence shows

            </HelpSectionHeading>

            <dl

              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}

              data-testid="help-search-review-evidence-feature-items"

            >

              {SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS.map((item) => (

                <div key={item.label}>

                  <dt className="font-medium text-al-text-primary">{item.label}</dt>

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

              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}

              data-testid="help-search-review-evidence-how-stepper"

            >

              {SEARCH_REVIEW_EVIDENCE_HELP_HOW_TO_READ_STEPS.map((step) => (

                <li key={step}>{step}</li>

              ))}

            </ol>

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>

              <Link className={OPERATOR_LINK.inline} href={SEARCH_REVIEW_EVIDENCE_HELP_EVIDENCE_GRAPH_HREF}>

                Open evidence graph →

              </Link>

            </p>

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>

              <Link className={OPERATOR_LINK.inline} href={SEARCH_REVIEW_EVIDENCE_HELP_ASK_HREF}>

                Ask review questions →

              </Link>

            </p>

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>

              <Link className={OPERATOR_LINK.inline} href={SEARCH_REVIEW_EVIDENCE_HELP_FINDINGS_HREF}>

                Open findings queue →

              </Link>

            </p>

          </section>



          <SearchReviewEvidenceHelpEvidenceOrientationStrip />

        </div>



        <HelpTopicTableOfContents headings={SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS} />

      </div>

    </article>

  );

}


