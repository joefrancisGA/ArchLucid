import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  WORKING_CAREER_REHEARSAL_HELP_CANONICAL_PATH,
  WORKING_CAREER_REHEARSAL_HELP_TOPIC_LABEL,
} from "@/lib/governance/working-career-rehearsal-help-evidence-copy";
import {
  WORKING_CAREER_REHEARSAL_HELP_DOOR_TILES,
  WORKING_CAREER_REHEARSAL_HELP_GUIDE_HEADINGS,
  WORKING_CAREER_REHEARSAL_HELP_GUIDED_NOTE,
  WORKING_CAREER_REHEARSAL_HELP_OVERVIEW,
  WORKING_CAREER_REHEARSAL_HELP_PAGE_SUBTITLE,
  WORKING_CAREER_REHEARSAL_HELP_PAGE_TITLE,
  WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION,
  WORKING_CAREER_REHEARSAL_HELP_RELATED,
  WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_COPY,
  WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE,
} from "@/lib/governance/working-career-rehearsal-help-guide-content";
import {
  WORKING_CAREER_REHEARSAL_HELP_GUIDE_TEST_ID,
  WORKING_CAREER_REHEARSAL_HELP_PRIMARY_CONTENT_ID,
} from "@/lib/governance/working-career-rehearsal-help-page-copy";
import { HELP_PAGE_LAYOUT, HELP_PAGE_TOC, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpWorkingCareerRehearsalGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

const HELP_CAREER_REHEARSAL_DOOR_TILE_CAREER_TEST_ID = "help-career-rehearsal-door-tile-career" as const;
const HELP_CAREER_REHEARSAL_DOOR_TILE_REHEARSAL_TEST_ID = "help-career-rehearsal-door-tile-rehearsal" as const;

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

/** Working Career vs Rehearsal door orientation for `/help/career-rehearsal-doors` (AS-082). */
export function HelpWorkingCareerRehearsalGuideView(
  props: HelpWorkingCareerRehearsalGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(WORKING_CAREER_REHEARSAL_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={WORKING_CAREER_REHEARSAL_HELP_GUIDE_TEST_ID}
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={WORKING_CAREER_REHEARSAL_HELP_PAGE_TITLE}
        titleTestId="help-career-rehearsal-doors-page-title"
        subtitle={WORKING_CAREER_REHEARSAL_HELP_PAGE_SUBTITLE}
        navHref={WORKING_CAREER_REHEARSAL_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <div
        id={WORKING_CAREER_REHEARSAL_HELP_PRIMARY_CONTENT_ID}
        data-testid={WORKING_CAREER_REHEARSAL_HELP_PRIMARY_CONTENT_ID}
        className={contentGridClass}
      >
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <p className={readingBodyClass} data-testid="help-career-rehearsal-doors-overview">
            {WORKING_CAREER_REHEARSAL_HELP_OVERVIEW}
          </p>

          <section aria-labelledby="which-door" className="space-y-4">
            <HelpSectionHeading id="which-door">Which door should I use?</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-career-rehearsal-doors-tiles">
              {WORKING_CAREER_REHEARSAL_HELP_DOOR_TILES.map((tile) => (
                <article
                  key={tile.id}
                  className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                  data-testid={
                    tile.id === "career"
                      ? HELP_CAREER_REHEARSAL_DOOR_TILE_CAREER_TEST_ID
                      : HELP_CAREER_REHEARSAL_DOOR_TILE_REHEARSAL_TEST_ID
                  }
                >
                  <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{tile.label}</h3>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{tile.detail}</p>
                  <p className={cn("m-0 mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>{tile.whenToUse}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="simulator-honesty" className="space-y-3">
            <HelpSectionHeading id="simulator-honesty">
              {WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE}
            </HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-career-rehearsal-doors-simulator-honesty">
              {WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_COPY}
            </p>
          </section>

          <section aria-labelledby="guided-vs-working" className="space-y-3">
            <HelpSectionHeading id="guided-vs-working">Guided vs Working</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-career-rehearsal-doors-guided-note">
              {WORKING_CAREER_REHEARSAL_HELP_GUIDED_NOTE}
            </p>
          </section>

          <section aria-labelledby="where-to-go-next" className="space-y-3">
            <HelpSectionHeading id="where-to-go-next">Where to go next</HelpSectionHeading>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION.href}>
                  {WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={WORKING_CAREER_REHEARSAL_HELP_RELATED.href}>
                  {WORKING_CAREER_REHEARSAL_HELP_RELATED.label}
                </Link>
              </Button>
            </div>
          </section>
        </div>

        <aside className={HELP_PAGE_TOC.nav}>
          <HelpTopicTableOfContents headings={WORKING_CAREER_REHEARSAL_HELP_GUIDE_HEADINGS} />
          <p className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Topic: {WORKING_CAREER_REHEARSAL_HELP_TOPIC_LABEL}
          </p>
        </aside>
      </div>
    </article>
  );
}
