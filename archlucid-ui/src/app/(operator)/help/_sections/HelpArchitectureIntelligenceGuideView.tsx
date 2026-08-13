import Link from "next/link";



import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";

import { ArchitectureIntelligenceHelpEvidenceOrientationStrip } from "@/components/help/ArchitectureIntelligenceHelpEvidenceOrientationStrip";

import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";

import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";

import { ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-intelligence-evidence-copy";

import { ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH } from "@/lib/architecture-intelligence-help-evidence-copy";

import {

  ARCHITECTURE_INTELLIGENCE_HELP_EVIDENCE_GRAPH_HREF,

  ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS,

  ARCHITECTURE_INTELLIGENCE_HELP_FINDINGS_HREF,

  ARCHITECTURE_INTELLIGENCE_HELP_GUIDE_HEADINGS,

  ARCHITECTURE_INTELLIGENCE_HELP_HOW_TO_READ_STEPS,

  ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW,

  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE,

  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_TITLE,

  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION,

  ARCHITECTURE_INTELLIGENCE_HELP_REVIEWS_NEW_HREF,

} from "@/lib/architecture-intelligence-help-guide-content";

import {

  OPERATOR_CARD,

  OPERATOR_LAYOUT,

  OPERATOR_LINK,

  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,

  OPERATOR_TYPOGRAPHY,

} from "@/lib/design-tokens";

import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";

import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

import { cn } from "@/lib/utils";



type HelpArchitectureIntelligenceGuideViewProps = {

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



/** Operator architecture intelligence orientation for `/help/architecture-intelligence`. */

export function HelpArchitectureIntelligenceGuideView(

  props: HelpArchitectureIntelligenceGuideViewProps,

): React.ReactElement {

  const { entry } = props;

  const contentGridClass = resolveHelpPageContentGridClass(ARCHITECTURE_INTELLIGENCE_HELP_GUIDE_HEADINGS.length);



  return (

    <article

      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}

      data-testid="help-architecture-intelligence-guide"

    >

      <HelpTopicHashScroll />



      <OperatorPageHeader

        title={ARCHITECTURE_INTELLIGENCE_HELP_PAGE_TITLE}

        titleTestId="help-architecture-intelligence-page-title"

        subtitle={ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE}

        navHref={ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH}

        headingLevel="h1"


        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}

        actions={<PageContextualHelpButton />}

      />



      <div className={contentGridClass}>

        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>

          <p

            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}

            data-testid="help-architecture-intelligence-overview"

          >

            {ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW}

          </p>



          <Card

            className="border-neutral-200 dark:border-neutral-800"

            data-testid="help-architecture-intelligence-action-panel"

          >

            <CardHeader className={OPERATOR_CARD.header}>

              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open architecture intelligence</CardTitle>

            </CardHeader>

            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>

              <Button asChild size="sm" variant="primary">

                <Link href={ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.href}>

                  {ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.label}

                </Link>

              </Button>

            </CardContent>

          </Card>



          <section

            aria-labelledby="what-architecture-intelligence-does"

            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"

          >

            <HelpSectionHeading id="what-architecture-intelligence-does">

              What architecture intelligence does

            </HelpSectionHeading>

            <dl

              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}

              data-testid="help-architecture-intelligence-feature-items"

            >

              {ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS.map((item) => (

                <div key={item.label}>

                  <dt className="font-medium text-al-text-primary">{item.label}</dt>

                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>

                </div>

              ))}

            </dl>

          </section>



          <section

            aria-labelledby="how-architecture-intelligence-works"

            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"

          >

            <HelpSectionHeading id="how-architecture-intelligence-works">

              {ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL}

            </HelpSectionHeading>

            <ol

              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}

              data-testid="help-architecture-intelligence-how-stepper"

            >

              {ARCHITECTURE_INTELLIGENCE_HELP_HOW_TO_READ_STEPS.map((step) => (

                <li key={step}>{step}</li>

              ))}

            </ol>

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>

              <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_INTELLIGENCE_HELP_FINDINGS_HREF}>

                Open findings queue →

              </Link>

            </p>

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>

              <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_INTELLIGENCE_HELP_REVIEWS_NEW_HREF}>

                Start a review →

              </Link>

            </p>

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>

              <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_INTELLIGENCE_HELP_EVIDENCE_GRAPH_HREF}>

                Open evidence graph →

              </Link>

            </p>

          </section>



          <ArchitectureIntelligenceHelpEvidenceOrientationStrip />

        </div>



        <HelpTopicTableOfContents headings={ARCHITECTURE_INTELLIGENCE_HELP_GUIDE_HEADINGS} />

      </div>

    </article>

  );

}


