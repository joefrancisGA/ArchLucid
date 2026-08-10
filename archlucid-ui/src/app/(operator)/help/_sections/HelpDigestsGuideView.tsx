import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DIGESTS_HELP_DESTINATION_CARDS,
  DIGESTS_HELP_GUIDE_HEADINGS,
  DIGESTS_HELP_HOW_DIGESTS_WORK_STEPS,
  DIGESTS_HELP_OVERVIEW,
  DIGESTS_HELP_PAGE_SUBTITLE,
  DIGESTS_HELP_PAGE_TITLE,
  DIGESTS_HELP_PRIMARY_ACTIONS,
} from "@/lib/digests-help-guide-content";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpDigestsGuideViewProps = {
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

function HowDigestsWorkStepper(): React.ReactElement {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="help-digests-how-stepper"
    >
      <ol className="m-0 flex list-none flex-col gap-3 p-0 xl:flex-row xl:items-stretch">
        {DIGESTS_HELP_HOW_DIGESTS_WORK_STEPS.map((step, index) => (
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
            {index < DIGESTS_HELP_HOW_DIGESTS_WORK_STEPS.length - 1 ? (
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

/** Operator Digests orientation for `/help/digests` (TB-2049). */
export function HelpDigestsGuideView(props: HelpDigestsGuideViewProps): React.ReactElement {
  void props.entry;

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-digests-guide"
    >
      <HelpTopicHashScroll />

      <header className="space-y-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <HelpTopicTitleRow title={DIGESTS_HELP_PAGE_TITLE} />
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {DIGESTS_HELP_PAGE_SUBTITLE}
            </p>
          </div>
          <PageContextualHelpButton />
        </div>
      </header>
<div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.body)}>{DIGESTS_HELP_OVERVIEW}</p>
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-digests-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Go to Digests</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={DIGESTS_HELP_PRIMARY_ACTIONS.openHub.href}>
                {DIGESTS_HELP_PRIMARY_ACTIONS.openHub.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={DIGESTS_HELP_PRIMARY_ACTIONS.openSchedule.href}>
                {DIGESTS_HELP_PRIMARY_ACTIONS.openSchedule.label}
              </Link>
            </Button>
            <Link
              href={DIGESTS_HELP_PRIMARY_ACTIONS.openSubscriptions.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {DIGESTS_HELP_PRIMARY_ACTIONS.openSubscriptions.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <section aria-labelledby="how-digests-work-heading" className="space-y-3">
            <HelpSectionHeading id="how-digests-work">How digests work</HelpSectionHeading>
            <p id="how-digests-work-heading" className="sr-only">
              How digests work
            </p>
            <HowDigestsWorkStepper />
          </section>

          <section
            aria-labelledby="where-digests-are-managed-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="where-digests-are-managed">Where digests are managed</HelpSectionHeading>
            <p id="where-digests-are-managed-heading" className="sr-only">
              Where digests are managed
            </p>
            <div className="grid gap-3 sm:grid-cols-3" data-testid="help-digests-destination-cards">
              {DIGESTS_HELP_DESTINATION_CARDS.map((card) => (
                <Card key={card.id} className="h-full border-neutral-200 dark:border-neutral-800">
                  <CardHeader className={OPERATOR_CARD.header}>
                    <CardTitle className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>{card.title}</CardTitle>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{card.description}</p>
                  </CardHeader>
                  <CardContent className={OPERATOR_CARD.content}>
                    <Button asChild size="sm" variant="outline">
                      <Link href={card.href}>{card.actionLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <HelpTopicTableOfContents headings={[...DIGESTS_HELP_GUIDE_HEADINGS]} />
        </aside>
      </div>
    </article>
  );
}
