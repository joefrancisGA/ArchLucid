import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { EvidenceGraphHelpClaimDisciplineStrip } from "@/components/help/EvidenceGraphHelpClaimDisciplineStrip";
import { EvidenceGraphHelpRelatedNextStepsStrip } from "@/components/help/EvidenceGraphHelpRelatedNextStepsStrip";
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
import { EVIDENCE_GRAPH_HELP_TOPIC_LABEL } from "@/lib/evidence-graph-evidence-copy";
import {
  EVIDENCE_GRAPH_HELP_GUIDE_HEADINGS,
  EVIDENCE_GRAPH_HELP_HOW_TO_READ_STEPS,
  EVIDENCE_GRAPH_HELP_OVERVIEW,
  EVIDENCE_GRAPH_HELP_PAGE_SUBTITLE,
  EVIDENCE_GRAPH_HELP_PAGE_TITLE,
  EVIDENCE_GRAPH_HELP_PRIMARY_ACTION,
  EVIDENCE_GRAPH_HELP_SAMPLE_GRAPH_NOTE,
  EVIDENCE_GRAPH_HELP_START_HERE_CARD_TITLE,
  EVIDENCE_GRAPH_HELP_TILE_ITEMS,
} from "@/lib/evidence-graph-help-guide-content";
import { EVIDENCE_GRAPH_HELP_CANONICAL_PATH } from "@/lib/evidence-graph-help-evidence-copy";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpEvidenceGraphGuideViewProps = {
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

/** Operator evidence graph orientation for `/help/evidence-graph`. */
export function HelpEvidenceGraphGuideView(props: HelpEvidenceGraphGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(EVIDENCE_GRAPH_HELP_GUIDE_HEADINGS.length);
  const showSectionNav = EVIDENCE_GRAPH_HELP_GUIDE_HEADINGS.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-evidence-graph-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={EVIDENCE_GRAPH_HELP_PAGE_TITLE}
        titleTestId="help-evidence-graph-page-title"
        subtitle={EVIDENCE_GRAPH_HELP_PAGE_SUBTITLE}
        navHref={EVIDENCE_GRAPH_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <EvidenceGraphHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <div className="space-y-4" data-testid="help-evidence-graph-first-viewport">
            <p className={readingBodyClass} data-testid="help-evidence-graph-overview">
              {EVIDENCE_GRAPH_HELP_OVERVIEW}
            </p>

            <Card
              className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
              data-testid="help-evidence-graph-action-panel"
              id="start-here"
            >
              <CardHeader className={OPERATOR_CARD.header}>
                <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {EVIDENCE_GRAPH_HELP_START_HERE_CARD_TITLE}
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
                <Button asChild size="sm" variant="primary">
                  <Link href={EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.href}>{EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.label}</Link>
                </Button>
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="help-evidence-graph-sample-graph-note"
                >
                  {EVIDENCE_GRAPH_HELP_SAMPLE_GRAPH_NOTE}
                </p>
              </CardContent>
            </Card>
          </div>

          <section
            aria-labelledby="what-evidence-graph-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-evidence-graph-shows">What the evidence graph shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-evidence-graph-tile-items"
            >
              {EVIDENCE_GRAPH_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">
                    <Link className={OPERATOR_LINK.nav} href={item.href}>
                      {item.label}
                    </Link>
                  </dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-evidence-graph-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-evidence-graph-works">{EVIDENCE_GRAPH_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-evidence-graph-how-stepper"
            >
              {EVIDENCE_GRAPH_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <EvidenceGraphHelpRelatedNextStepsStrip />
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={EVIDENCE_GRAPH_HELP_GUIDE_HEADINGS} enableScrollSpy /> : null}
      </div>
    </article>
  );
}
