import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ImprovementPlanningHelpEvidenceOrientationStrip } from "@/components/help/ImprovementPlanningHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  IMPROVEMENT_PLANNING_HELP_GUIDE_HEADINGS,
  IMPROVEMENT_PLANNING_HELP_HOW_TO_READ_STEPS,
  IMPROVEMENT_PLANNING_HELP_OVERVIEW,
  IMPROVEMENT_PLANNING_HELP_PAGE_SUBTITLE,
  IMPROVEMENT_PLANNING_HELP_PAGE_TITLE,
  IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION,
  IMPROVEMENT_PLANNING_HELP_TILE_ITEMS,
} from "@/lib/improvement-planning-help-guide-content";
import { IMPROVEMENT_PLANNING_HELP_CANONICAL_PATH } from "@/lib/improvement-planning-help-evidence-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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

/** Improvement planning orientation for `/help/improvement-planning`. */
export function HelpImprovementPlanningGuideView(props: HelpImprovementPlanningGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(IMPROVEMENT_PLANNING_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-improvement-planning-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={IMPROVEMENT_PLANNING_HELP_PAGE_TITLE}
        titleTestId="help-improvement-planning-page-title"
        subtitle={IMPROVEMENT_PLANNING_HELP_PAGE_SUBTITLE}
        navHref={IMPROVEMENT_PLANNING_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-improvement-planning-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: IMPROVEMENT_PLANNING_HELP_PAGE_TITLE }]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-improvement-planning-overview"
          >
            {IMPROVEMENT_PLANNING_HELP_OVERVIEW}
          </p>

          <Card
            className="border-neutral-200 dark:border-neutral-800"
            data-testid="help-improvement-planning-action-panel"
          >
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.label}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.href}>
                  {IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-improvement-planning-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-improvement-planning-shows">What improvement planning shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-improvement-planning-tile-items"
            >
              {IMPROVEMENT_PLANNING_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-improvement-planning-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-improvement-planning-works">How improvement planning works</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-improvement-planning-how-stepper"
            >
              {IMPROVEMENT_PLANNING_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <ImprovementPlanningHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={IMPROVEMENT_PLANNING_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
