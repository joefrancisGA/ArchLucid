import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAlertsGuideHeroClient } from "@/app/(operator)/help/_sections/HelpAlertsGuideHeroClient";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
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
import { AlertsHelpEvidenceOrientationStrip } from "@/components/help/AlertsHelpEvidenceOrientationStrip";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAlertsGuideViewProps = {
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
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-sm font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100"
              >
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

/** Buyer-safe governance alerts orientation for `/help/alerts`. */
export function HelpAlertsGuideView(props: HelpAlertsGuideViewProps): React.ReactElement {
  const { entry } = props;

  return (
    <article className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")} data-testid="help-alerts-guide">
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <HelpTopicTitleRow title={ALERTS_HELP_PAGE_TITLE} actions={<PageContextualHelpButton />} />
        <p className={cn("m-0 max-w-[42rem]", OPERATOR_TYPOGRAPHY.helper)}>{ALERTS_HELP_PAGE_SUBTITLE}</p>
        <HelpTopicRegistryProvenanceLine entry={entry} />
      </header>

      <HelpAlertsGuideHeroClient />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-8", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-alerts-overview">
            {ALERTS_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="how-alerts-work"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-alerts-work">How alerts work</HelpSectionHeading>
            <HowAlertsWorkStepper />
          </section>

          <section
            aria-labelledby="what-can-trigger-an-alert"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-can-trigger-an-alert">What can trigger an alert</HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ALERTS_HELP_TRIGGER_INTRO}</p>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              {ALERTS_HELP_TRIGGER_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="where-alerts-are-managed"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
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
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
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
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="related-governance-concepts">Related governance concepts</HelpSectionHeading>
            <div className="grid gap-3" data-testid="help-alerts-related-concepts">
              {ALERTS_HELP_RELATED_CONCEPTS.map((concept) => (
                <div
                  key={concept.title}
                  className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
                >
                  <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{concept.title}</h3>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{concept.description}</p>
                  <Link
                    className={cn(
                      "mt-2 inline-block text-sm underline-offset-2 hover:underline",
                      DESIGN_TOKENS.accent.link,
                    )}
                    href={concept.href}
                  >
                    {concept.linkLabel}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <AlertsHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={ALERTS_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
