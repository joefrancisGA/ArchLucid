import Link from "next/link";

import { HelpEvidenceGraphHeaderActions } from "@/app/(operator)/help/_sections/HelpEvidenceGraphHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { EvidenceGraphHelpRelatedNextStepsStrip } from "@/components/help/EvidenceGraphHelpRelatedNextStepsStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  EVIDENCE_GRAPH_HELP_CANONICAL_PATH,
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE,
} from "@/lib/evidence-graph-help-evidence-copy";
import {
  EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID,
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
import {
  EVIDENCE_GRAPH_HELP_FIRST_VIEWPORT_TEST_ID,
  EVIDENCE_GRAPH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  EVIDENCE_GRAPH_HELP_PRIMARY_CONTENT_ID,
  EVIDENCE_GRAPH_HELP_SKIP_LINK_LABEL,
  EVIDENCE_GRAPH_HELP_SKIP_TARGET_ID,
} from "@/lib/evidence-graph-help-page-copy";
import { EVIDENCE_GRAPH_HELP_TOPIC_LABEL } from "@/lib/evidence-graph-evidence-copy";
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
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-evidence-graph",
    EVIDENCE_GRAPH_HELP_GUIDE_HEADINGS,
    EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const showSectionNav = guideHeadings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-evidence-graph-guide"
    >
      <a href={`#${EVIDENCE_GRAPH_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {EVIDENCE_GRAPH_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={EVIDENCE_GRAPH_HELP_PAGE_TITLE}
        titleTestId="help-evidence-graph-page-title"
        subtitle={EVIDENCE_GRAPH_HELP_PAGE_SUBTITLE}
        claimDiscipline={EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE}
        claimDisciplineTestId={EVIDENCE_GRAPH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        navHref={EVIDENCE_GRAPH_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<HelpEvidenceGraphHeaderActions entry={entry} />}
      />

      <div
        id={EVIDENCE_GRAPH_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
        data-testid={EVIDENCE_GRAPH_HELP_PRIMARY_CONTENT_ID}
      >
        <div
          className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
          data-testid={EVIDENCE_GRAPH_HELP_FIRST_VIEWPORT_TEST_ID}
        >
          <p className={readingBodyClass} data-testid="help-evidence-graph-overview">
            {EVIDENCE_GRAPH_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-evidence-graph-action-panel"
            id="start-here"
            aria-labelledby={EVIDENCE_GRAPH_HELP_SKIP_TARGET_ID}
          >
            <h2
              id={EVIDENCE_GRAPH_HELP_SKIP_TARGET_ID}
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {EVIDENCE_GRAPH_HELP_START_HERE_CARD_TITLE}
            </h2>
            <Button asChild size="sm" variant="primary">
              <Link href={EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.href}>{EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.label}</Link>
            </Button>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-evidence-graph-sample-graph-note"
            >
              {EVIDENCE_GRAPH_HELP_SAMPLE_GRAPH_NOTE}
            </p>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")} data-testid="help-evidence-graph-primary">
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
          </div>

          {showSectionNav ? <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy /> : null}
        </div>

        <EvidenceGraphHelpRelatedNextStepsStrip />
      </div>
    </article>
  );
}
