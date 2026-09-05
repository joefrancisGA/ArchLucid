import Link from "next/link";

import { HelpAlertsGuideHeroClient } from "@/app/(operator)/help/_sections/HelpAlertsGuideHeroClient";
import { HelpAlertsHeaderActions } from "@/app/(operator)/help/_sections/HelpAlertsHeaderActions";
import { HelpAlertsSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpAlertsSourcesOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { AlertsHelpEvidenceOrientationStrip } from "@/components/help/AlertsHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { ALERTS_HELP_CLAIM_HEADING_ID } from "@/lib/alerts-help-evidence-copy";
import {
  ALERTS_HELP_DESTINATION_CARDS,
  ALERTS_HELP_GUIDE_HEADINGS,
  ALERTS_HELP_HOW_ALERTS_WORK_STEPS,
  ALERTS_HELP_OVERVIEW,
  ALERTS_HELP_PAGE_SUBTITLE,
  ALERTS_HELP_PAGE_TITLE,
  ALERTS_HELP_RELATED_CONCEPTS,
  ALERTS_HELP_RESOLUTION_STEPS,
  ALERTS_HELP_TRIGGER_INTRO,
  ALERTS_HELP_TRIGGER_ITEMS,
} from "@/lib/alerts-help-guide-content";
import {
  ALERTS_HELP_CANONICAL_PATH,
  ALERTS_HELP_CLAIM_DISCIPLINE,
} from "@/lib/alerts-help-evidence-copy";
import {
  ALERTS_HELP_FIRST_VIEWPORT_TEST_ID,
  ALERTS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ALERTS_HELP_PAGE_SUBTITLE_BUYER,
  ALERTS_HELP_PRIMARY_CONTENT_ID,
  ALERTS_HELP_SKIP_LINK_LABEL,
  ALERTS_HELP_SKIP_TARGET_ID,
} from "@/lib/alerts-help-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAlertsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function alertsHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? ALERTS_HELP_PAGE_SUBTITLE_BUYER : ALERTS_HELP_PAGE_SUBTITLE;
}

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

function HowAlertsWorkStepper(): React.ReactElement {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="help-alerts-how-stepper"
    >
      <ol className="m-0 flex list-none flex-col gap-3 p-0 xl:flex-row xl:items-stretch">
        {ALERTS_HELP_HOW_ALERTS_WORK_STEPS.map((step, index) => (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
              <span aria-hidden className={HELP_PAGE_LAYOUT.workflowStepNumber}>
                {index + 1}
              </span>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step}</p>
            </div>
            {index < ALERTS_HELP_HOW_ALERTS_WORK_STEPS.length - 1 ? (
              <span aria-hidden className="hidden shrink-0 text-xl text-neutral-400 xl:inline">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function HelpAlertsGuideBody(props: { readonly readingBodyClass: string }): React.ReactElement {
  const { readingBodyClass } = props;

  return (
    <>
      <p className={readingBodyClass} data-testid="help-alerts-overview">
        {ALERTS_HELP_OVERVIEW}
      </p>

      <section
        aria-labelledby="how-alerts-work"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      >
        <HelpSectionHeading id="how-alerts-work">How alerts work</HelpSectionHeading>
        <HowAlertsWorkStepper />
      </section>

      <section
        aria-labelledby="what-can-trigger-an-alert"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      >
        <HelpSectionHeading id="what-can-trigger-an-alert">What can trigger an alert</HelpSectionHeading>
        <p className={readingBodyClass}>{ALERTS_HELP_TRIGGER_INTRO}</p>
        <ul className={HELP_PAGE_LAYOUT.bulletList}>
          {ALERTS_HELP_TRIGGER_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="where-alerts-are-managed"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      >
        <HelpSectionHeading id="where-alerts-are-managed">Where alerts are managed</HelpSectionHeading>
        <div className="grid gap-3 sm:grid-cols-2" data-testid="help-alerts-destination-cards">
          {ALERTS_HELP_DESTINATION_CARDS.map((card) => (
            <div
              key={card.id}
              className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
            >
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{card.title}</h3>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="resolving-an-alert"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      >
        <HelpSectionHeading id="resolving-an-alert">Resolving an alert</HelpSectionHeading>
        <ol className={HELP_PAGE_LAYOUT.orderedList} data-testid="help-alerts-resolution-steps">
          {ALERTS_HELP_RESOLUTION_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="related-governance-concepts"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      >
        <HelpSectionHeading id="related-governance-concepts">Related approval concepts</HelpSectionHeading>
        <div className="grid gap-3" data-testid="help-alerts-related-concepts">
          {ALERTS_HELP_RELATED_CONCEPTS.map((concept) => (
            <div
              key={concept.title}
              className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
            >
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{concept.title}</h3>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{concept.description}</p>
              <Link
                className={cn("mt-2 inline-block text-sm underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
                href={concept.href}
              >
                {concept.linkLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/** Buyer-safe governance alerts orientation for `/help/alerts`. */
export function HelpAlertsGuideView(props: HelpAlertsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-alerts",
    ALERTS_HELP_GUIDE_HEADINGS,
    ALERTS_HELP_CLAIM_HEADING_ID,
  );
  const tocHeadings = buyerPolishedShell
    ? guideHeadings.filter((heading) => heading.id !== "where-to-go-next")
    : guideHeadings;
  const contentGridClass = resolveHelpPageContentGridClass(tocHeadings.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-alerts-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${ALERTS_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {ALERTS_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}
      <HelpTopicHashScroll />

      <div
        id={ALERTS_HELP_PRIMARY_CONTENT_ID}
        data-testid={ALERTS_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        {buyerPolishedShell ? (
          <HelpTopicGuidePageHeader
            title={ALERTS_HELP_PAGE_TITLE}
            titleTestId="help-alerts-page-title"
            subtitle={alertsHelpPageSubtitle(true)}
            navHref={ALERTS_HELP_CANONICAL_PATH}
            headingLevel="h1"
            claimDiscipline={ALERTS_HELP_CLAIM_DISCIPLINE}
            claimDisciplineTestId={ALERTS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            actions={<HelpAlertsHeaderActions />}
          />
        ) : (
          <HelpTopicGuidePageHeader
            title={ALERTS_HELP_PAGE_TITLE}
            titleTestId="help-alerts-page-title"
            subtitle={alertsHelpPageSubtitle(false)}
            navHref={ALERTS_HELP_CANONICAL_PATH}
            headingLevel="h1"
            metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
            actions={<HelpAlertsHeaderActions />}
          />
        )}

        {buyerPolishedShell ? (
          <div
            id={ALERTS_HELP_SKIP_TARGET_ID}
            data-testid={ALERTS_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <HelpAlertsGuideHeroClient />
          </div>
        ) : (
          <HelpAlertsGuideHeroClient />
        )}

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            {!buyerPolishedShell ? <AlertsHelpEvidenceOrientationStrip /> : null}

            <HelpAlertsGuideBody readingBodyClass={readingBodyClass} />
          </div>

          <HelpTopicTableOfContents headings={tocHeadings} enableScrollSpy={!buyerPolishedShell} />
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-alerts-orientation-bottom">
            <HelpAlertsSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
