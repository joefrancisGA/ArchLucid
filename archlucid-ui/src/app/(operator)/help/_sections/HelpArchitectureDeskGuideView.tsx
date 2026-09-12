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
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CANONICAL_PATH,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_TOPIC_LABEL,
} from "@/lib/system-not-job-help-system-not-job-evidence-copy";
import {
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CONCEPT_TILES,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_GUIDE_HEADINGS,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_GUIDED_NOTE,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_OVERVIEW,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_SUBTITLE,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_TITLE,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PRIMARY_ACTION,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_SECONDARY_ACTIONS,
} from "@/lib/system-not-job-help-system-not-job-guide-content";
import {
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_GUIDE_TEST_ID,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PRIMARY_CONTENT_ID,
} from "@/lib/system-not-job-help-system-not-job-page-copy";
import { SYSTEM_NOT_JOB_HELP_GUIDED_NOTE_HEADING_ID } from "@/lib/system-not-job-help-system-not-job-route";
import { cn } from "@/lib/utils";

type HelpArchitectureDeskGuideViewProps = {
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

/** SN-032 — Working architecture desk orientation for `/help/architecture-desk`. */
export function HelpArchitectureDeskGuideView(props: HelpArchitectureDeskGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(
    SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_GUIDE_HEADINGS.length,
  );
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_GUIDE_TEST_ID}
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_TITLE}
        titleTestId="help-architecture-desk-page-title"
        subtitle={SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_SUBTITLE}
        navHref={SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <div
        id={SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PRIMARY_CONTENT_ID}
        data-testid={SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PRIMARY_CONTENT_ID}
        className={contentGridClass}
      >
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <p className={readingBodyClass} data-testid="help-architecture-desk-overview">
            {SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_OVERVIEW}
          </p>

          <section aria-labelledby="monday-object" className="space-y-4">
            <HelpSectionHeading id="monday-object">What is the Monday object?</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-architecture-desk-concept-tiles">
              {SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CONCEPT_TILES.map((tile) => (
                <article
                  key={tile.id}
                  className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                  data-testid={`help-architecture-desk-tile-${tile.id}`}
                >
                  <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{tile.title}</h3>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{tile.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby={SYSTEM_NOT_JOB_HELP_GUIDED_NOTE_HEADING_ID} className="space-y-3">
            <HelpSectionHeading id={SYSTEM_NOT_JOB_HELP_GUIDED_NOTE_HEADING_ID}>Guided vs Working</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-architecture-desk-guided-note">
              {SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_GUIDED_NOTE}
            </p>
          </section>

          <section aria-labelledby="where-to-go-next" className="space-y-3">
            <HelpSectionHeading id="where-to-go-next">Where to go next</HelpSectionHeading>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PRIMARY_ACTION.href}>
                  {SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PRIMARY_ACTION.label}
                </Link>
              </Button>
              {SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_SECONDARY_ACTIONS.map((action) => (
                <Button key={action.href} asChild size="sm" variant="secondary">
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
          </section>
        </div>

        <aside className={HELP_PAGE_TOC.nav}>
          <HelpTopicTableOfContents headings={SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_GUIDE_HEADINGS} />
          <p className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Topic: {SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_TOPIC_LABEL}
          </p>
        </aside>
      </div>
    </article>
  );
}
