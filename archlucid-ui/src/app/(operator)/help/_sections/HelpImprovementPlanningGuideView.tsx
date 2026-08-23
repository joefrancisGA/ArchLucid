import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ImprovementPlanningHelpEvidenceOrientationStrip } from "@/components/help/ImprovementPlanningHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import {
  IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION,
  IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION_TAG,
  IMPROVEMENT_PLANNING_HELP_GUIDE_HEADINGS,
  IMPROVEMENT_PLANNING_HELP_HOW_TO_READ_STEPS,
  IMPROVEMENT_PLANNING_HELP_OUTPUT_TILE_ITEMS,
  IMPROVEMENT_PLANNING_HELP_OVERVIEW,
  IMPROVEMENT_PLANNING_HELP_PAGE_SUBTITLE,
  IMPROVEMENT_PLANNING_HELP_PAGE_TITLE,
  IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION,
  IMPROVEMENT_PLANNING_HELP_SHOW_TILE_ITEMS,
  IMPROVEMENT_PLANNING_HELP_START_HERE_CARD_TITLE,
} from "@/lib/improvement-planning-help-guide-content";
import { IMPROVEMENT_PLANNING_HELP_CANONICAL_PATH } from "@/lib/improvement-planning-help-evidence-copy";
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
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpImprovementPlanningGuideViewProps = {
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

function HelpTileList(props: {
  readonly items: readonly { readonly label: string; readonly detail: string; readonly href: string }[];
  readonly testId: string;
}): React.ReactElement {
  return (
    <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)} data-testid={props.testId}>
      {props.items.map((item) => (
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
  );
}

/** Improvement planning orientation for `/help/improvement-planning`. */
export function HelpImprovementPlanningGuideView(props: HelpImprovementPlanningGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(IMPROVEMENT_PLANNING_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-improvement-planning-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={IMPROVEMENT_PLANNING_HELP_PAGE_TITLE}
        titleTestId="help-improvement-planning-page-title"
        subtitle={IMPROVEMENT_PLANNING_HELP_PAGE_SUBTITLE}
        navHref={IMPROVEMENT_PLANNING_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-improvement-planning-overview">
            {IMPROVEMENT_PLANNING_HELP_OVERVIEW}
          </p>

          <Card
            className="border-neutral-200 dark:border-neutral-800"
            data-testid="help-improvement-planning-action-panel"
          >
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {IMPROVEMENT_PLANNING_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="primary">
                  <Link href={IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.href}>
                    {IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.label}
                  </Link>
                </Button>
                <StatusTag
                  kind="neutral"
                  label={IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION_TAG}
                  data-testid="help-improvement-planning-feedback-precondition-tag"
                />
              </div>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-improvement-planning-feedback-precondition"
              >
                {IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION}
              </p>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-improvement-planning-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-improvement-planning-shows">What improvement planning shows</HelpSectionHeading>
            <HelpTileList
              items={IMPROVEMENT_PLANNING_HELP_SHOW_TILE_ITEMS}
              testId="help-improvement-planning-show-tile-items"
            />
          </section>

          <section
            aria-labelledby="what-planning-returns"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-planning-returns">What planning returns</HelpSectionHeading>
            <HelpTileList
              items={IMPROVEMENT_PLANNING_HELP_OUTPUT_TILE_ITEMS}
              testId="help-improvement-planning-output-tile-items"
            />
          </section>

          <section
            aria-labelledby="how-improvement-planning-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-improvement-planning-works">How improvement planning works</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-improvement-planning-how-stepper"
            >
              {IMPROVEMENT_PLANNING_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <ImprovementPlanningHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
          </div>
        </div>

        <HelpTopicTableOfContents headings={IMPROVEMENT_PLANNING_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
