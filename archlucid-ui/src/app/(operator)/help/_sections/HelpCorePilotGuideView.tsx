import Link from "next/link";
import type { ReactNode } from "react";

import { CorePilotHelpOrientationFooter } from "@/app/(operator)/help/_sections/CorePilotHelpOrientationFooter";
import { CorePilotHelpPostStepperPanel } from "@/app/(operator)/help/_sections/CorePilotHelpPostStepperPanel";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpCorePilotWorkflowStepper } from "@/app/(operator)/help/_sections/HelpCorePilotWorkflowStepper";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  CORE_PILOT_HELP_DISCLOSURE,
  CORE_PILOT_HELP_GUIDE_HEADINGS,
  CORE_PILOT_HELP_PRIMARY_ACTIONS,
  CORE_PILOT_HELP_SUMMARY_COPY,
  CORE_PILOT_HELP_SUMMARY_TITLE,
} from "@/lib/core-pilot-help-guide-content";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { corePilotHelpRelatedGuides } from "@/lib/core-pilot-help-related-guides";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpCorePilotGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 mt-10 first:mt-0")}
    >
      {props.children}
    </h2>
  );
}

function HelpDisclosure(props: {
  readonly title: string;
  readonly children: ReactNode;
  readonly testId?: string;
}): React.ReactElement {
  return (
    <details className={HELP_PAGE_LAYOUT.details} data-testid={props.testId}>
      <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</summary>
      <div className={cn(HELP_PAGE_LAYOUT.detailsBody, OPERATOR_TYPOGRAPHY.body)}>{props.children}</div>
    </details>
  );
}

/** Guided first-review workflow for `/help/first-architecture-review` — action-oriented, not prose documentation. */
export function HelpCorePilotGuideView(props: HelpCorePilotGuideViewProps): React.ReactElement {
  const { entry } = props;

  return (
    <article className={OPERATOR_LAYOUT.majorSectionGap} data-testid="help-core-pilot-guide">
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <HelpTopicTitleRow title={entry.title} />
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{entry.summary}</p>
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
          <PageContextualHelpButton />
        </div>
      </header>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <div className="space-y-6" data-testid="core-pilot-first-viewport">
            <Card
              id="first-review-path"
              className={cn(
                OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                "border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20",
              )}
              data-testid="core-pilot-summary-card"
            >
              <CardHeader className={OPERATOR_CARD.header}>
                <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                  {CORE_PILOT_HELP_SUMMARY_TITLE}
                </CardTitle>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{CORE_PILOT_HELP_SUMMARY_COPY}</p>
              </CardHeader>
              <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap gap-2")}>
                <Button asChild size="sm" data-testid="core-pilot-primary-start-cta">
                  <Link href={CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.href}>
                    {CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.label}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.href}>
                    {CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.label}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <section aria-labelledby="run-the-first-review" className="space-y-4">
              <HelpSectionHeading id="run-the-first-review">Run the first review</HelpSectionHeading>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                Follow these five steps in order. Each step links to the product surface where you take action.
              </p>
              <HelpCorePilotWorkflowStepper />
            </section>
          </div>

          <HelpDisclosure title={CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.title}>
            {CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.body}
          </HelpDisclosure>

          <CorePilotHelpPostStepperPanel />

          <CorePilotHelpOrientationFooter />

          <section
            aria-labelledby="depth-guides-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="core-pilot-related-guides"
          >
            <h2 id="depth-guides-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Related guides
            </h2>
            <ul className={cn("m-0 flex flex-wrap gap-x-4 gap-y-2 p-0 list-none", OPERATOR_TYPOGRAPHY.body)}>
              {corePilotHelpRelatedGuides().map((guide) => (
                <li key={guide.href}>
                  <Link
                    href={guide.href}
                    className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
                  >
                    {guide.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Stuck?{" "}
              <Link
                href={CORE_PILOT_HELP_PRIMARY_ACTIONS.troubleshooting.href}
                className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
              >
                {CORE_PILOT_HELP_PRIMARY_ACTIONS.troubleshooting.label}
              </Link>
            </p>
          </section>
        </div>

        <HelpTopicTableOfContents headings={CORE_PILOT_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
