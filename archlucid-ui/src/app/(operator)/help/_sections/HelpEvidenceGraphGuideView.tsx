import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { EvidenceGraphHelpEvidenceOrientationStrip } from "@/components/help/EvidenceGraphHelpEvidenceOrientationStrip";
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
import { EVIDENCE_GRAPH_HELP_TOPIC_LABEL } from "@/lib/evidence-graph-evidence-copy";
import {
  EVIDENCE_GRAPH_HELP_EVIDENCE_TRAIL_HREF,
  EVIDENCE_GRAPH_HELP_FEATURE_ITEMS,
  EVIDENCE_GRAPH_HELP_GUIDE_HEADINGS,
  EVIDENCE_GRAPH_HELP_HOW_TO_READ_STEPS,
  EVIDENCE_GRAPH_HELP_OVERVIEW,
  EVIDENCE_GRAPH_HELP_PAGE_SUBTITLE,
  EVIDENCE_GRAPH_HELP_PAGE_TITLE,
  EVIDENCE_GRAPH_HELP_PRIMARY_ACTION,
  EVIDENCE_GRAPH_HELP_SEARCH_HREF,
} from "@/lib/evidence-graph-help-guide-content";
import { EVIDENCE_GRAPH_HELP_CANONICAL_PATH } from "@/lib/evidence-graph-help-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-evidence-graph-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={EVIDENCE_GRAPH_HELP_PAGE_TITLE}
        titleTestId="help-evidence-graph-page-title"
        subtitle={EVIDENCE_GRAPH_HELP_PAGE_SUBTITLE}
        navHref={EVIDENCE_GRAPH_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-evidence-graph-overview"
          >
            {EVIDENCE_GRAPH_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-evidence-graph-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open evidence graph</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.href}>{EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-evidence-graph-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-evidence-graph-shows">What the evidence graph shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-evidence-graph-feature-items"
            >
              {EVIDENCE_GRAPH_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
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
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-evidence-graph-how-stepper"
            >
              {EVIDENCE_GRAPH_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={EVIDENCE_GRAPH_HELP_EVIDENCE_TRAIL_HREF}>
                Read evidence trail help →
              </Link>
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={EVIDENCE_GRAPH_HELP_SEARCH_HREF}>
                Search review evidence →
              </Link>
            </p>
          </section>

          <EvidenceGraphHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={EVIDENCE_GRAPH_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
