import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { PreferencesHelpEvidenceOrientationStrip } from "@/components/help/PreferencesHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  PREFERENCES_HELP_CHANGES_ITEMS,
  PREFERENCES_HELP_CHANGES_SECTION_TITLE,
  PREFERENCES_HELP_GUIDE_HEADINGS,
  PREFERENCES_HELP_HOW_SECTION_TITLE,
  PREFERENCES_HELP_HOW_TO_READ_STEPS,
  PREFERENCES_HELP_OVERVIEW,
  PREFERENCES_HELP_PAGE_SUBTITLE,
  PREFERENCES_HELP_PAGE_TITLE,
  PREFERENCES_HELP_PRIMARY_ACTION,
  PREFERENCES_HELP_START_HERE_CARD_TITLE,
  PREFERENCES_HELP_START_HERE_HELPER,
  PREFERENCES_HELP_TILE_ITEMS,
} from "@/lib/preferences-help-guide-content";
import { PREFERENCES_HELP_CANONICAL_PATH } from "@/lib/preferences-help-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpPreferencesGuideViewProps = {
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

function HelpTileList(props: {
  readonly items: readonly { readonly label: string; readonly detail: string }[];
  readonly testId: string;
}): React.ReactElement {
  return (
    <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)} data-testid={props.testId}>
      {props.items.map((item) => (
        <div key={item.label}>
          <dt className="font-medium text-al-text-primary">{item.label}</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Operator preferences orientation for `/help/preferences`. */
export function HelpPreferencesGuideView(props: HelpPreferencesGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(PREFERENCES_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")} data-testid="help-preferences-guide">
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={PREFERENCES_HELP_PAGE_TITLE}
        titleTestId="help-preferences-page-title"
        subtitle={PREFERENCES_HELP_PAGE_SUBTITLE}
        navHref={PREFERENCES_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-preferences-overview">
            {PREFERENCES_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-preferences-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {PREFERENCES_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-preferences-start-here-helper"
              >
                {PREFERENCES_HELP_START_HERE_HELPER}
              </p>
              <Button asChild size="sm" variant="primary">
                <Link href={PREFERENCES_HELP_PRIMARY_ACTION.href}>{PREFERENCES_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-preferences-cover"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-preferences-cover">What preferences cover</HelpSectionHeading>
            <HelpTileList items={PREFERENCES_HELP_TILE_ITEMS} testId="help-preferences-tile-items" />
          </section>

          <section
            aria-labelledby="what-changes-and-what-does-not"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-changes-and-what-does-not">
              {PREFERENCES_HELP_CHANGES_SECTION_TITLE}
            </HelpSectionHeading>
            <HelpTileList items={PREFERENCES_HELP_CHANGES_ITEMS} testId="help-preferences-changes-items" />
          </section>

          <section
            aria-labelledby="how-preferences-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-preferences-work">{PREFERENCES_HELP_HOW_SECTION_TITLE}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-preferences-how-stepper"
            >
              {PREFERENCES_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <PreferencesHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
          </div>
        </div>

        <HelpTopicTableOfContents headings={PREFERENCES_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
