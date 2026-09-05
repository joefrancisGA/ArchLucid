"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { HelpCorePilotFirstViewportJobChrome } from "@/app/(operator)/help/_sections/HelpCorePilotFirstViewportJobChrome";
import { HelpCorePilotJobMatrix } from "@/app/(operator)/help/_sections/HelpCorePilotJobMatrix";
import { CorePilotHelpClosingPanel } from "@/app/(operator)/help/_sections/CorePilotHelpClosingPanel";
import { CorePilotHelpPostStepperPanel } from "@/app/(operator)/help/_sections/CorePilotHelpPostStepperPanel";
import { FirstReviewGuideFirstArchitectureReviewVocabularyRail } from "@/components/FirstReviewGuideFirstArchitectureReviewVocabularyRail";
import { PilotGuideGettingStartedFirstReviewVocabularyRail } from "@/components/PilotGuideGettingStartedFirstReviewVocabularyRail";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpCorePilotWorkflowStepper } from "@/app/(operator)/help/_sections/HelpCorePilotWorkflowStepper";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  CORE_PILOT_HELP_DISCLOSURE,
  CORE_PILOT_HELP_GUIDE_HEADINGS,
  CORE_PILOT_HELP_PRIMARY_ACTIONS,
  resolveCorePilotHelpSummaryCopy,
  resolveCorePilotHelpSummaryTitle,
} from "@/lib/core-pilot-help-guide-content";
import {
  HELP_EVALUATING_ARCHITECTURE_SECTION_TITLE,
  resolveHelpWorkingDeskPrimaryActions,
} from "@/lib/help/help-workspace-mode-copy";
import { cn } from "@/lib/utils";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
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
  const { isWorkingMode } = useWorkspaceMode();
  const summaryTitle = resolveCorePilotHelpSummaryTitle(isWorkingMode);
  const summaryCopy = resolveCorePilotHelpSummaryCopy(isWorkingMode);
  const deskPrimaryActions = resolveHelpWorkingDeskPrimaryActions();
  const contentGridClass = resolveHelpPageContentGridClass(CORE_PILOT_HELP_GUIDE_HEADINGS.length);
  const showSectionNav = CORE_PILOT_HELP_GUIDE_HEADINGS.length >= HELP_PAGE_MIN_TOC_HEADINGS;

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

      {isWorkingMode ? (
        <details className={HELP_PAGE_LAYOUT.details} data-testid="core-pilot-evaluating-architecture-section">
          <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {HELP_EVALUATING_ARCHITECTURE_SECTION_TITLE}
          </summary>
          <div className={cn(HELP_PAGE_LAYOUT.detailsBody, "space-y-0")}>
            <PilotGuideGettingStartedFirstReviewVocabularyRail
              currentSurfaceId="first-architecture-review"
              variant="full"
            />
            <FirstReviewGuideFirstArchitectureReviewVocabularyRail
              currentSurfaceId="first-architecture-review"
              variant="full"
            />
          </div>
        </details>
      ) : (
        <details className={HELP_PAGE_LAYOUT.details} data-testid="core-pilot-guide-vocabulary-disclosure">
          <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>About this guide</summary>
          <div className={cn(HELP_PAGE_LAYOUT.detailsBody, "space-y-0")}>
            <PilotGuideGettingStartedFirstReviewVocabularyRail
              currentSurfaceId="first-architecture-review"
              variant="full"
            />
            <FirstReviewGuideFirstArchitectureReviewVocabularyRail
              currentSurfaceId="first-architecture-review"
              variant="full"
            />
          </div>
        </details>
      )}

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <div className="space-y-6" data-testid="core-pilot-first-viewport">
            {isWorkingMode ? null : <HelpCorePilotJobMatrix />}

            <section
              id="first-review-path"
              aria-labelledby="core-pilot-summary-heading"
              className={cn(
                OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                "space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
              )}
              data-testid="core-pilot-summary-card"
            >
              <h2
                id="core-pilot-summary-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                {summaryTitle}
              </h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{summaryCopy}</p>
              <div className="flex flex-wrap gap-2">
                {isWorkingMode ? (
                  deskPrimaryActions.map((action) => (
                    <Button key={action.href} asChild size="sm" variant={action.label === "New review" ? "primary" : "outline"}>
                      <Link href={action.href}>{action.label}</Link>
                    </Button>
                  ))
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </section>

            {isWorkingMode ? null : <HelpCorePilotFirstViewportJobChrome />}
          </div>

          <section aria-labelledby="run-the-first-review" className="space-y-3">
            <HelpSectionHeading id="run-the-first-review">Run the first review</HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Follow these five steps in order.</p>
            <HelpCorePilotWorkflowStepper />
          </section>

          <HelpDisclosure title={CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.title}>
            {CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.body}
          </HelpDisclosure>

          <HelpDisclosure
            title={CORE_PILOT_HELP_DISCLOSURE.actorIntakeForFindingEngines.title}
            testId="core-pilot-actor-intake-disclosure"
          >
            {CORE_PILOT_HELP_DISCLOSURE.actorIntakeForFindingEngines.body}
          </HelpDisclosure>

          <CorePilotHelpPostStepperPanel />

          <CorePilotHelpClosingPanel />
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={CORE_PILOT_HELP_GUIDE_HEADINGS} /> : null}
      </div>
    </article>
  );
}
