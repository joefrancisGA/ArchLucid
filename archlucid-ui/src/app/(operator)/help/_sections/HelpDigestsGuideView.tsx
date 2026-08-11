import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { DigestsHelpEvidenceOrientationStrip } from "@/components/help/DigestsHelpEvidenceOrientationStrip";
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
  DIGESTS_HELP_PRIMARY_ACTION,
} from "@/lib/digests-help-guide-content";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help-page-layout";
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
      <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-4">
        {DIGESTS_HELP_HOW_DIGESTS_WORK_STEPS.map((step, index) => (
          <li key={step} className="min-w-0">
            <div className="flex h-full flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
              <span className="sr-only">{`Step ${index + 1}`}</span>
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-sm font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100"
              >
                {index + 1}
              </span>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Operator Digests orientation for `/help/digests` (TB-2049). */
export function HelpDigestsGuideView(props: HelpDigestsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(DIGESTS_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-digests-guide"
    >
      <HelpTopicHashScroll />

      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <HelpTopicTitleRow title={DIGESTS_HELP_PAGE_TITLE} actions={<PageContextualHelpButton />} />
        <p className={cn("m-0 max-w-[42rem]", OPERATOR_TYPOGRAPHY.helper)}>{DIGESTS_HELP_PAGE_SUBTITLE}</p>
        <HelpTopicRegistryProvenanceLine entry={entry} />
      </header>

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-digests-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Manage digests</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={DIGESTS_HELP_PRIMARY_ACTION.href}>{DIGESTS_HELP_PRIMARY_ACTION.label}</Link>
            </Button>
          </CardContent>
        </Card>

        <DigestsHelpEvidenceOrientationStrip />
      </div>

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-8")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-digests-overview">
            {DIGESTS_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="how-digests-work"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-digests-work">How digests work</HelpSectionHeading>
            <HowDigestsWorkStepper />
          </section>

          <section
            aria-labelledby="where-digests-are-managed"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="where-digests-are-managed">Where digests are managed</HelpSectionHeading>
            <div className="grid items-stretch gap-3 sm:grid-cols-3" data-testid="help-digests-destination-cards">
              {DIGESTS_HELP_DESTINATION_CARDS.map((card) => (
                <Card key={card.id} className="flex h-full min-w-0 flex-col border-neutral-200 dark:border-neutral-800">
                  <CardHeader className={cn(OPERATOR_CARD.header, "flex-1")}>
                    <CardTitle as="h3" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{card.title}</CardTitle>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{card.description}</p>
                  </CardHeader>
                  <CardContent className={OPERATOR_CARD.content}>
                    <Button asChild className="w-full" size="sm" variant="outline">
                      <Link href={card.href}>{card.actionLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
