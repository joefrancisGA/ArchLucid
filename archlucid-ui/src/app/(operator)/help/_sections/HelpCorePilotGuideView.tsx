"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { HelpCorePilotFirstViewportJobChrome } from "@/app/(operator)/help/_sections/HelpCorePilotFirstViewportJobChrome";
import { HelpCorePilotJobMatrix } from "@/app/(operator)/help/_sections/HelpCorePilotJobMatrix";
import { HelpCorePilotSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpCorePilotSourcesOrientationStrip";
import { CorePilotHelpClosingPanel } from "@/app/(operator)/help/_sections/CorePilotHelpClosingPanel";
import { CorePilotHelpPostStepperPanel } from "@/app/(operator)/help/_sections/CorePilotHelpPostStepperPanel";
import { FirstReviewGuideFirstArchitectureReviewVocabularyRail } from "@/components/FirstReviewGuideFirstArchitectureReviewVocabularyRail";
import { PilotGuideGettingStartedFirstReviewVocabularyRail } from "@/components/PilotGuideGettingStartedFirstReviewVocabularyRail";
import { CorePilotHelpEvidenceOrientationStrip } from "@/components/help/CorePilotHelpEvidenceOrientationStrip";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpCorePilotWorkflowStepper } from "@/app/(operator)/help/_sections/HelpCorePilotWorkflowStepper";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
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
  CORE_PILOT_HELP_CANONICAL_PATH,
  CORE_PILOT_HELP_CLAIM_DISCIPLINE,
} from "@/lib/core-pilot-help-evidence-copy";
import {
  CORE_PILOT_HELP_FIRST_VIEWPORT_TEST_ID,
  CORE_PILOT_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CORE_PILOT_HELP_ORIENTATION_BOTTOM_TEST_ID,
  CORE_PILOT_HELP_PAGE_LEAD,
  CORE_PILOT_HELP_PAGE_SUBTITLE_BUYER,
  CORE_PILOT_HELP_PRIMARY_CONTENT_ID,
  CORE_PILOT_HELP_SKIP_LINK_LABEL,
  CORE_PILOT_HELP_SKIP_TARGET_ID,
  CORE_PILOT_HELP_START_HERE_HELPER,
} from "@/lib/core-pilot-help-page-copy";
import {
  HELP_EVALUATING_ARCHITECTURE_SECTION_TITLE,
  resolveHelpWorkingDeskPrimaryActions,
} from "@/lib/help/help-workspace-mode-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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
import {
  corePilotActorIntakeDisclosureHrefFromSearch,
  parseCorePilotActorIntakeOpenFromSearch,
} from "@/lib/help/core-pilot-actor-intake-disclosure-url";
import {
  corePilotGuideVocabularyDisclosureHrefFromSearch,
  parseCorePilotGuideVocabularyOpenFromSearch,
} from "@/lib/help/core-pilot-guide-vocabulary-disclosure-url";
import {
  corePilotWhatGuideCoversDisclosureHrefFromSearch,
  parseCorePilotWhatGuideCoversOpenFromSearch,
} from "@/lib/help/core-pilot-what-guide-covers-disclosure-url";

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
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}): React.ReactElement {
  const controlled = props.open !== undefined && props.onOpenChange !== undefined;

  return (
    <details
      className={HELP_PAGE_LAYOUT.details}
      data-testid={props.testId}
      open={controlled ? props.open : undefined}
      onToggle={
        controlled
          ? (event) => {
              props.onOpenChange?.((event.currentTarget as HTMLDetailsElement).open);
            }
          : undefined
      }
    >
      <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</summary>
      <div className={cn(HELP_PAGE_LAYOUT.detailsBody, OPERATOR_TYPOGRAPHY.body)}>{props.children}</div>
    </details>
  );
}

function CorePilotSummaryCard(props: {
  readonly summaryTitle: string;
  readonly summaryCopy: string;
  readonly isWorkingMode: boolean;
  readonly deskPrimaryActions: ReturnType<typeof resolveHelpWorkingDeskPrimaryActions>;
}): React.ReactElement {
  return (
    <section
      id="first-review-path"
      aria-labelledby="core-pilot-summary-heading"
      className={cn(
        OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
        "space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
      )}
      data-testid="core-pilot-summary-card"
    >
      <h2 id="core-pilot-summary-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {props.summaryTitle}
      </h2>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{props.summaryCopy}</p>
      <div className="flex flex-wrap gap-2">
        {props.isWorkingMode ? (
          props.deskPrimaryActions.map((action) => (
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
  );
}

/** Guided first-review workflow for `/help/first-architecture-review` — action-oriented, not prose documentation. */
export function HelpCorePilotGuideView(props: HelpCorePilotGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const corePilotGuideVocabularyOpenParam = searchParams.get("corePilotGuideVocabularyOpen");
  const corePilotWhatGuideCoversOpenParam = searchParams.get("corePilotWhatGuideCoversOpen");
  const corePilotActorIntakeOpenParam = searchParams.get("corePilotActorIntakeOpen");
  const [guideVocabularyOpen, setGuideVocabularyOpenState] = useState(() =>
    parseCorePilotGuideVocabularyOpenFromSearch(corePilotGuideVocabularyOpenParam),
  );
  const [whatGuideCoversOpen, setWhatGuideCoversOpenState] = useState(() =>
    parseCorePilotWhatGuideCoversOpenFromSearch(corePilotWhatGuideCoversOpenParam),
  );
  const [actorIntakeOpen, setActorIntakeOpenState] = useState(() =>
    parseCorePilotActorIntakeOpenFromSearch(corePilotActorIntakeOpenParam),
  );
  const { isWorkingMode } = useWorkspaceMode();
  const summaryTitle = resolveCorePilotHelpSummaryTitle(isWorkingMode);
  const summaryCopy = resolveCorePilotHelpSummaryCopy(isWorkingMode);
  const deskPrimaryActions = resolveHelpWorkingDeskPrimaryActions();
  const showSectionNav = !buyerPolishedShell && CORE_PILOT_HELP_GUIDE_HEADINGS.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(
    showSectionNav ? CORE_PILOT_HELP_GUIDE_HEADINGS.length : 0,
  );
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  const syncGuideVocabularyOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        corePilotGuideVocabularyDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setGuideVocabularyOpen = useCallback(
    (open: boolean) => {
      setGuideVocabularyOpenState(open);
      syncGuideVocabularyOpenToUrl(open);
    },
    [syncGuideVocabularyOpenToUrl],
  );

  const syncWhatGuideCoversOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        corePilotWhatGuideCoversDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setWhatGuideCoversOpen = useCallback(
    (open: boolean) => {
      setWhatGuideCoversOpenState(open);
      syncWhatGuideCoversOpenToUrl(open);
    },
    [syncWhatGuideCoversOpenToUrl],
  );

  const syncActorIntakeOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        corePilotActorIntakeDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setActorIntakeOpen = useCallback(
    (open: boolean) => {
      setActorIntakeOpenState(open);
      syncActorIntakeOpenToUrl(open);
    },
    [syncActorIntakeOpenToUrl],
  );

  useEffect(() => {
    setGuideVocabularyOpenState(parseCorePilotGuideVocabularyOpenFromSearch(corePilotGuideVocabularyOpenParam));
  }, [corePilotGuideVocabularyOpenParam]);

  useEffect(() => {
    setWhatGuideCoversOpenState(parseCorePilotWhatGuideCoversOpenFromSearch(corePilotWhatGuideCoversOpenParam));
  }, [corePilotWhatGuideCoversOpenParam]);

  useEffect(() => {
    setActorIntakeOpenState(parseCorePilotActorIntakeOpenFromSearch(corePilotActorIntakeOpenParam));
  }, [corePilotActorIntakeOpenParam]);

  const firstViewportContent = (
    <>
      {isWorkingMode ? null : <HelpCorePilotJobMatrix />}
      <CorePilotSummaryCard
        summaryTitle={summaryTitle}
        summaryCopy={summaryCopy}
        isWorkingMode={isWorkingMode}
        deskPrimaryActions={deskPrimaryActions}
      />
      {isWorkingMode ? null : <HelpCorePilotFirstViewportJobChrome />}
    </>
  );

  const pageBody = (
    <>
      {buyerPolishedShell ? (
        <OperatorPageHeader
          title={entry.title}
          titleTestId="help-core-pilot-page-title"
          subtitle={CORE_PILOT_HELP_PAGE_SUBTITLE_BUYER}
          subtitleClassName="max-w-3xl"
          navHref={CORE_PILOT_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={CORE_PILOT_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={CORE_PILOT_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        />
      ) : (
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
      )}

      {!buyerPolishedShell ? (
        isWorkingMode ? (
          <details
            className={HELP_PAGE_LAYOUT.details}
            data-testid="core-pilot-evaluating-architecture-section"
            open={guideVocabularyOpen}
            onToggle={(event) => {
              setGuideVocabularyOpen((event.currentTarget as HTMLDetailsElement).open);
            }}
          >
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
          <details
            className={HELP_PAGE_LAYOUT.details}
            data-testid="core-pilot-guide-vocabulary-disclosure"
            open={guideVocabularyOpen}
            onToggle={(event) => {
              setGuideVocabularyOpen((event.currentTarget as HTMLDetailsElement).open);
            }}
          >
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
        )
      ) : null}

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          {buyerPolishedShell ? (
            <div
              id={CORE_PILOT_HELP_SKIP_TARGET_ID}
              data-testid={CORE_PILOT_HELP_FIRST_VIEWPORT_TEST_ID}
              className={cn(
                "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                OPERATOR_LAYOUT.sectionStack,
              )}
            >
              <div className="space-y-4" data-testid="help-core-pilot-buyer-intro">
                <p className={readingBodyClass} data-testid="help-core-pilot-intro">
                  {CORE_PILOT_HELP_PAGE_LEAD}
                </p>
              </div>
              {firstViewportContent}
              <p
                className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-core-pilot-start-here-helper"
              >
                {CORE_PILOT_HELP_START_HERE_HELPER}
              </p>
            </div>
          ) : (
            <div className="space-y-6" data-testid="core-pilot-first-viewport">
              {firstViewportContent}
            </div>
          )}

          <section aria-labelledby="run-the-first-review" className="space-y-3">
            <HelpSectionHeading id="run-the-first-review">Run the first review</HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Follow these five steps in order.</p>
            <HelpCorePilotWorkflowStepper />
          </section>

          <HelpDisclosure
            title={CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.title}
            open={whatGuideCoversOpen}
            onOpenChange={setWhatGuideCoversOpen}
          >
            {CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.body}
          </HelpDisclosure>

          <HelpDisclosure
            title={CORE_PILOT_HELP_DISCLOSURE.actorIntakeForFindingEngines.title}
            testId="core-pilot-actor-intake-disclosure"
            open={actorIntakeOpen}
            onOpenChange={setActorIntakeOpen}
          >
            {CORE_PILOT_HELP_DISCLOSURE.actorIntakeForFindingEngines.body}
          </HelpDisclosure>

          <HelpDisclosure
            title={CORE_PILOT_HELP_DISCLOSURE.universalIntakeMustEngineCoverage.title}
            testId="core-pilot-must-engine-coverage-disclosure"
          >
            {CORE_PILOT_HELP_DISCLOSURE.universalIntakeMustEngineCoverage.body}
          </HelpDisclosure>

          <CorePilotHelpPostStepperPanel />

          {buyerPolishedShell ? null : <CorePilotHelpClosingPanel />}
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={CORE_PILOT_HELP_GUIDE_HEADINGS} /> : null}
      </div>

      {buyerPolishedShell ? (
        <div data-testid={CORE_PILOT_HELP_ORIENTATION_BOTTOM_TEST_ID}>
          <HelpCorePilotSourcesOrientationStrip />
        </div>
      ) : null}
    </>
  );

  return (
    <article className={OPERATOR_LAYOUT.majorSectionGap} data-testid="help-core-pilot-guide">
      {buyerPolishedShell ? (
        <a href={`#${CORE_PILOT_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {CORE_PILOT_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      {buyerPolishedShell ? (
        <div
          id={CORE_PILOT_HELP_PRIMARY_CONTENT_ID}
          data-testid={CORE_PILOT_HELP_PRIMARY_CONTENT_ID}
          className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
        >
          {pageBody}
        </div>
      ) : (
        pageBody
      )}
    </article>
  );
}
