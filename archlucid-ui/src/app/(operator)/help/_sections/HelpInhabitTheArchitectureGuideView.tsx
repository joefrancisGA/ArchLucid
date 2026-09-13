import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, HELP_PAGE_TOC, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import { INHABIT_THE_ARCHITECTURE_HELP_TOPIC_LABEL } from "@/lib/inhabit/inhabit-help-evidence-copy";
import {
  INHABIT_THE_ARCHITECTURE_HELP_CONCEPT_TILES,
  INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS,
  INHABIT_THE_ARCHITECTURE_HELP_OVERVIEW,
  INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_TITLE,
  INHABIT_THE_ARCHITECTURE_HELP_TWO_CONTROLS_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_PAGE_SUBTITLE,
  INHABIT_THE_ARCHITECTURE_HELP_PAGE_TITLE,
  INHABIT_THE_ARCHITECTURE_HELP_PATH,
  INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION,
  INHABIT_THE_ARCHITECTURE_HELP_SECONDARY_ACTIONS,
} from "@/lib/inhabit/inhabit-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

export const INHABIT_THE_ARCHITECTURE_HELP_GUIDE_TEST_ID = "help-inhabit-the-architecture-guide" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_CONTENT_ID =
  "help-inhabit-the-architecture-primary-content" as const;

type HelpInhabitTheArchitectureGuideViewProps = {
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

/** IH-014 — Working inhabit orientation for `/help/inhabit-the-architecture`. */
export function HelpInhabitTheArchitectureGuideView(
  props: HelpInhabitTheArchitectureGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={INHABIT_THE_ARCHITECTURE_HELP_GUIDE_TEST_ID}
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={INHABIT_THE_ARCHITECTURE_HELP_PAGE_TITLE}
        titleTestId="help-inhabit-the-architecture-page-title"
        subtitle={INHABIT_THE_ARCHITECTURE_HELP_PAGE_SUBTITLE}
        navHref={INHABIT_THE_ARCHITECTURE_HELP_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <div
        id={INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_CONTENT_ID}
        data-testid={INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_CONTENT_ID}
        className={contentGridClass}
      >
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <p className={readingBodyClass} data-testid="help-inhabit-the-architecture-overview">
            {INHABIT_THE_ARCHITECTURE_HELP_OVERVIEW}
          </p>

          <section aria-labelledby="what-is-this-desk" className="space-y-4">
            <HelpSectionHeading id="what-is-this-desk">What is this desk?</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-inhabit-the-architecture-concept-tiles">
              {INHABIT_THE_ARCHITECTURE_HELP_CONCEPT_TILES.map((tile) => (
                <article
                  key={tile.id}
                  className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                  data-testid={`help-inhabit-the-architecture-tile-${tile.id}`}
                >
                  <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{tile.title}</h3>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{tile.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="two-controls-only" className="space-y-3">
            <HelpSectionHeading id="two-controls-only">Two controls only</HelpSectionHeading>
            <p
              className={readingBodyClass}
              data-testid="help-inhabit-the-architecture-two-controls"
            >
              {INHABIT_THE_ARCHITECTURE_HELP_TWO_CONTROLS_BODY}
            </p>
          </section>

          <section aria-labelledby="record-simulator-incomplete" className="space-y-3">
            <HelpSectionHeading id="record-simulator-incomplete">Record on Simulator host</HelpSectionHeading>
            <p
              className={readingBodyClass}
              data-testid="help-inhabit-the-architecture-record-simulator"
            >
              {INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY}
            </p>
          </section>

          <section aria-labelledby="sketch-is-practice" className="space-y-3">
            <HelpSectionHeading id="sketch-is-practice">{INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_TITLE}</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-inhabit-the-architecture-sketch-practice">
              {INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_BODY}
            </p>
          </section>

          <section aria-labelledby="where-to-go-next" className="space-y-3">
            <HelpSectionHeading id="where-to-go-next">Where to go next</HelpSectionHeading>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION.href}>
                  {INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
              {INHABIT_THE_ARCHITECTURE_HELP_SECONDARY_ACTIONS.map((action) => (
                <Button key={action.href} asChild size="sm" variant="secondary">
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
          </section>
        </div>

        <aside className={HELP_PAGE_TOC.nav}>
          <HelpTopicTableOfContents headings={[...INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS]} />
          <p className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Topic: {INHABIT_THE_ARCHITECTURE_HELP_TOPIC_LABEL}
          </p>
        </aside>
      </div>
    </article>
  );
}
