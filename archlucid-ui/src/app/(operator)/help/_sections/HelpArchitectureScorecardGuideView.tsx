import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ArchitectureScorecardHelpEvidenceOrientationStrip } from "@/components/help/ArchitectureScorecardHelpEvidenceOrientationStrip";
import { ScorecardRoiVocabularyRail } from "@/components/ScorecardRoiVocabularyRail";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  ARCHITECTURE_SCORECARD_HELP_GUIDE_HEADINGS,
  ARCHITECTURE_SCORECARD_HELP_HOW_TO_READ_STEPS,
  ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_HREF,
  ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_LABEL,
  ARCHITECTURE_SCORECARD_HELP_OVERVIEW,
  ARCHITECTURE_SCORECARD_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE,
  ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION,
  ARCHITECTURE_SCORECARD_HELP_SCORECARD_ROI_SECTION_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SIBLING_REPORTS,
  ARCHITECTURE_SCORECARD_HELP_TILE_ITEMS,
} from "@/lib/architecture-scorecard-help-guide-content";
import { ARCHITECTURE_SCORECARD_HELP_CANONICAL_PATH } from "@/lib/architecture-scorecard-help-evidence-copy";
import { cn } from "@/lib/utils";

type HelpArchitectureScorecardGuideViewProps = {
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

/** Operator architecture scorecard orientation for `/help/architecture-scorecard`. */
export function HelpArchitectureScorecardGuideView(
  props: HelpArchitectureScorecardGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(ARCHITECTURE_SCORECARD_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-architecture-scorecard-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE}
        titleTestId="help-architecture-scorecard-page-title"
        subtitle={ARCHITECTURE_SCORECARD_HELP_PAGE_SUBTITLE}
        navHref={ARCHITECTURE_SCORECARD_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-architecture-scorecard-overview"
          >
            {ARCHITECTURE_SCORECARD_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-architecture-scorecard-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open architecture scorecard</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.href}>
                  {ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-the-scorecard-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-the-scorecard-shows">What the scorecard shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-architecture-scorecard-tile-items"
            >
              {ARCHITECTURE_SCORECARD_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-to-read-architecture-scorecard"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-to-read-architecture-scorecard">How architecture scorecards work</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-architecture-scorecard-how-stepper"
            >
              {ARCHITECTURE_SCORECARD_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className={cn(DESIGN_TOKENS.surface.card, "p-4")} data-testid="help-architecture-scorecard-methodology">
              <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_HREF}>
                {ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_LABEL} →
              </Link>
            </div>
          </section>

          <section
            aria-labelledby="scorecard-vs-roi-summary"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="scorecard-vs-roi-summary">
              {ARCHITECTURE_SCORECARD_HELP_SCORECARD_ROI_SECTION_TITLE}
            </HelpSectionHeading>
            <ScorecardRoiVocabularyRail currentSurfaceId="scorecard" variant="compact" />
          </section>

          <section
            aria-labelledby="where-to-go-next"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="where-to-go-next">Where to go next</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-architecture-scorecard-sibling-reports">
              {ARCHITECTURE_SCORECARD_HELP_SIBLING_REPORTS.map((report) => (
                <Card key={report.id} className="border-neutral-200 dark:border-neutral-800">
                  <CardHeader className={OPERATOR_CARD.header}>
                    <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{report.description}</p>
                    <Link className={OPERATOR_LINK.inline} href={report.href}>
                      {report.actionLabel} →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <ArchitectureScorecardHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={ARCHITECTURE_SCORECARD_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
