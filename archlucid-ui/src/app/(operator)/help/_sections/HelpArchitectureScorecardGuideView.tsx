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
  CTA_WIDTH,
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
  ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_BODY,
  ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_FORMULA,
  ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_HREF,
  ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_LABEL,
  ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_SECTION_TITLE,
  ARCHITECTURE_SCORECARD_HELP_OVERVIEW,
  ARCHITECTURE_SCORECARD_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE,
  ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION,
  ARCHITECTURE_SCORECARD_HELP_SCORECARD_ROI_SECTION_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SIBLING_REPORTS,
  ARCHITECTURE_SCORECARD_HELP_TILE_ITEMS,
  ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_LINES,
  ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_TITLE,
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

          <div className="flex flex-wrap gap-2" data-testid="help-architecture-scorecard-primary-action">
            <Button asChild className={CTA_WIDTH.content} size="sm" variant="primary">
              <Link href={ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.href}>
                {ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.label}
              </Link>
            </Button>
          </div>

          <section
            aria-labelledby="what-the-scorecard-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-the-scorecard-shows">What the scorecard shows</HelpSectionHeading>
            <div
              className="grid gap-3 sm:grid-cols-2"
              data-testid="help-architecture-scorecard-tile-items"
            >
              {ARCHITECTURE_SCORECARD_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label} className={cn(DESIGN_TOKENS.surface.card, "space-y-1 p-4")}>
                  <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{item.label}</p>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{item.detail}</p>
                </div>
              ))}
            </div>
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
          </section>

          <section
            aria-labelledby="basis-of-estimate"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="basis-of-estimate">{ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_SECTION_TITLE}</HelpSectionHeading>
            <div
              className={cn(DESIGN_TOKENS.surface.card, "space-y-3 p-4")}
              data-testid="help-architecture-scorecard-methodology"
            >
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_BODY}</p>
              <p className={cn("m-0 font-mono text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_FORMULA}
              </p>
              <details className={HELP_PAGE_LAYOUT.details} data-testid="help-architecture-scorecard-worked-example">
                <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_TITLE}
                </summary>
                <ul className={cn(HELP_PAGE_LAYOUT.detailsBody, "m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                  {ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_LINES.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </details>
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
            <ScorecardRoiVocabularyRail currentSurfaceId="scorecard" variant="full" />
          </section>

          <ArchitectureScorecardHelpEvidenceOrientationStrip />

          <section
            aria-labelledby="where-to-go-next"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="where-to-go-next">Where to go next</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-architecture-scorecard-sibling-reports">
              {ARCHITECTURE_SCORECARD_HELP_SIBLING_REPORTS.map((report) => (
                <Card key={report.id} className="border-neutral-200 dark:border-neutral-800">
                  <CardHeader className={OPERATOR_CARD.header}>
                    <CardTitle as="h3" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {report.title}
                    </CardTitle>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{report.description}</p>
                  </CardHeader>
                  <CardContent className={OPERATOR_CARD.content}>
                    <Button asChild className={CTA_WIDTH.content} size="sm" variant="outline">
                      <Link href={report.href}>{report.actionLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <HelpTopicTableOfContents headings={ARCHITECTURE_SCORECARD_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
