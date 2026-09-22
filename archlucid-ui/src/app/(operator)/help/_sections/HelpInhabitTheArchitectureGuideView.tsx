import Link from "next/link";

import { HelpInhabitTheArchitectureHeaderActions } from "@/app/(operator)/help/_sections/HelpInhabitTheArchitectureHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { InhabitHelpCurrentDeskContextPanel } from "@/components/help/InhabitHelpCurrentDeskContextPanel";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicSectionCopyLink } from "@/components/help/HelpTopicSectionCopyLink";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { StatusTag } from "@/components/ui/status-tag";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import {
  INHABIT_THE_ARCHITECTURE_HELP_CLAIM_DISCIPLINE,
  INHABIT_THE_ARCHITECTURE_HELP_CLAIM_HEADING_ID,
  INHABIT_THE_ARCHITECTURE_HELP_TOPIC_LABEL,
} from "@/lib/inhabit/inhabit-help-evidence-copy";
import {
  INHABIT_THE_ARCHITECTURE_HELP_ADR_REFERENCES,
  INHABIT_THE_ARCHITECTURE_HELP_APPLICABILITY_DEMO,
  INHABIT_THE_ARCHITECTURE_HELP_APPLICABILITY_GUIDED,
  INHABIT_THE_ARCHITECTURE_HELP_APPLICABILITY_WORKING,
  INHABIT_THE_ARCHITECTURE_HELP_COMPARISON_ROWS,
  INHABIT_THE_ARCHITECTURE_HELP_CONCEPT_TILES,
  INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS,
  INHABIT_THE_ARCHITECTURE_HELP_HELP_RETURN,
  INHABIT_THE_ARCHITECTURE_HELP_KEYBOARD_SHORTCUT_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_MID_ANALYSIS_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_OVERVIEW,
  INHABIT_THE_ARCHITECTURE_HELP_PAGE_SUBTITLE,
  INHABIT_THE_ARCHITECTURE_HELP_PAGE_TITLE,
  INHABIT_THE_ARCHITECTURE_HELP_PATH,
  INHABIT_THE_ARCHITECTURE_HELP_PRACTICE_CANNOT_PROMOTE_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_PRACTICE_CANNOT_PROMOTE_TITLE,
  INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_HREF,
  INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_LABEL,
  INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS,
  INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS_HEADING,
  INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS_HEADING_ID,
  INHABIT_THE_ARCHITECTURE_HELP_SEALING_PATH_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_SEALING_PATH_HREF,
  INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_HONESTY,
  INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_HONESTY_TITLE,
  INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_STATUS_TAG,
  INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_TITLE,
  INHABIT_THE_ARCHITECTURE_HELP_SOURCES_ACTIONS,
  INHABIT_THE_ARCHITECTURE_HELP_TECHNICAL_MAPPING_INTRO,
  INHABIT_THE_ARCHITECTURE_HELP_TWO_CONTROLS_BODY,
} from "@/lib/inhabit/inhabit-help-guide-content";
import {
  INHABIT_THE_ARCHITECTURE_HELP_FIRST_VIEWPORT_TEST_ID,
  INHABIT_THE_ARCHITECTURE_HELP_GUIDE_TEST_ID,
  INHABIT_THE_ARCHITECTURE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_CONTENT_ID,
  INHABIT_THE_ARCHITECTURE_HELP_SKIP_LINK_LABEL,
  INHABIT_THE_ARCHITECTURE_HELP_SKIP_TARGET_ID,
} from "@/lib/inhabit/inhabit-help-page-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpInhabitTheArchitectureGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  /** Registry markdown is not rendered — guided view owns the body (TB-2238). */
  readonly markdown?: string;
};

function HelpSectionHeading(props: {
  readonly id: string;
  readonly level?: "h2" | "h3";
  readonly children: string;
  readonly showPermalink?: boolean;
}): React.ReactElement {
  const level = props.level ?? "h2";
  const className = cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    level === "h2" ? OPERATOR_TYPOGRAPHY.sectionTitle : OPERATOR_TYPOGRAPHY.cardTitle,
    "m-0 scroll-mt-24",
  );

  const heading =
    level === "h3" ? (
      <h3 id={props.id} className={className}>
        {props.children}
      </h3>
    ) : (
      <h2 id={props.id} className={className}>
        {props.children}
      </h2>
    );

  if (props.showPermalink !== true) {
    return heading;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {heading}
      <HelpTopicSectionCopyLink sectionId={props.id} sectionTitle={props.children} />
    </div>
  );
}

/** IH-014 — Working inhabit orientation for `/help/inhabit-the-architecture`. */
export function HelpInhabitTheArchitectureGuideView(
  props: HelpInhabitTheArchitectureGuideViewProps,
): React.ReactElement {
  void props.markdown;
  const { entry } = props;
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-inhabit-the-architecture",
    INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS,
    INHABIT_THE_ARCHITECTURE_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={INHABIT_THE_ARCHITECTURE_HELP_GUIDE_TEST_ID}
    >
      <a href={`#${INHABIT_THE_ARCHITECTURE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {INHABIT_THE_ARCHITECTURE_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <div
        id={INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_CONTENT_ID}
        data-testid={INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={INHABIT_THE_ARCHITECTURE_HELP_PAGE_TITLE}
          titleTestId="help-inhabit-the-architecture-page-title"
          subtitle={INHABIT_THE_ARCHITECTURE_HELP_PAGE_SUBTITLE}
          navHref={INHABIT_THE_ARCHITECTURE_HELP_PATH}
          headingLevel="h1"
          claimDiscipline={INHABIT_THE_ARCHITECTURE_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={INHABIT_THE_ARCHITECTURE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          breadcrumb={<HelpTopicBreadcrumb topicTitle={INHABIT_THE_ARCHITECTURE_HELP_TOPIC_LABEL} />}
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
          actions={<HelpInhabitTheArchitectureHeaderActions />}
        />

        <div
          id={INHABIT_THE_ARCHITECTURE_HELP_SKIP_TARGET_ID}
          data-testid={INHABIT_THE_ARCHITECTURE_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-inhabit-the-architecture-overview">
            {INHABIT_THE_ARCHITECTURE_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby={INHABIT_THE_ARCHITECTURE_HELP_CLAIM_HEADING_ID}
            className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-inhabit-the-architecture-simulator-honesty"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={INHABIT_THE_ARCHITECTURE_HELP_CLAIM_HEADING_ID}
                className={cn(
                  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                  "m-0 scroll-mt-24 text-al-text-primary",
                  OPERATOR_TYPOGRAPHY.sectionTitle,
                )}
              >
                {INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_HONESTY_TITLE}
              </h2>
              <StatusTag
                kind="neutral"
                label={INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_STATUS_TAG}
                data-testid="help-inhabit-the-architecture-simulator-status-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-inhabit-the-architecture-simulator-honesty-detail"
            >
              {INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_HONESTY}
            </p>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            <section aria-labelledby="what-is-this-desk" className="space-y-4">
              <HelpSectionHeading id="what-is-this-desk" showPermalink>
                What is this desk?
              </HelpSectionHeading>
              <div className="grid gap-3 sm:grid-cols-2" data-testid="help-inhabit-the-architecture-concept-tiles">
                {INHABIT_THE_ARCHITECTURE_HELP_CONCEPT_TILES.map((tile) => (
                  <article
                    key={tile.id}
                    id={`inhabit-concept-${tile.id}`}
                    className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                    data-testid={`help-inhabit-the-architecture-tile-${tile.id}`}
                  >
                    <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {tile.helpHref !== undefined ? (
                        <Link className={OPERATOR_LINK.inline} href={tile.helpHref}>
                          {tile.title}
                        </Link>
                      ) : tile.sectionId !== undefined ? (
                        <a className={OPERATOR_LINK.inline} href={`#${tile.sectionId}`}>
                          {tile.title}
                        </a>
                      ) : (
                        tile.title
                      )}
                    </h3>
                    <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{tile.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section
              aria-labelledby="help-inhabit-the-architecture-current-desk"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <InhabitHelpCurrentDeskContextPanel />
            </section>

            <section
              aria-labelledby="help-inhabit-the-architecture-applicability"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inhabit-the-architecture-applicability"
            >
              <HelpSectionHeading id="help-inhabit-the-architecture-applicability" showPermalink>
                Who sees the inhabit desk
              </HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-inhabit-the-architecture-seat-working">
                {INHABIT_THE_ARCHITECTURE_HELP_APPLICABILITY_WORKING}
              </p>
              <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-inhabit-the-architecture-seat-guided">
                {INHABIT_THE_ARCHITECTURE_HELP_APPLICABILITY_GUIDED}
              </p>
              <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-inhabit-the-architecture-seat-demo">
                {INHABIT_THE_ARCHITECTURE_HELP_APPLICABILITY_DEMO}
              </p>
            </section>

            <section aria-labelledby="two-controls-only" className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <HelpSectionHeading id="two-controls-only" showPermalink>Two controls only</HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-inhabit-the-architecture-two-controls">
                {INHABIT_THE_ARCHITECTURE_HELP_TWO_CONTROLS_BODY}
              </p>
            </section>

            <section
              aria-labelledby="record-vs-practice"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="record-vs-practice" showPermalink>Record vs Practice</HelpSectionHeading>
              <p className={readingBodyClass}>
                <Link className={OPERATOR_LINK.inline} href={INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_HREF}>
                  {INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_LABEL} →
                </Link>
              </p>
              <div className="max-w-3xl overflow-x-auto">
                <table
                  className={cn("w-full border-collapse text-left", HELP_PAGE_LAYOUT.readingBody)}
                  data-testid="help-inhabit-the-architecture-comparison-table"
                >
                  <caption className="sr-only">Record vs Practice on the inhabited architecture desk</caption>
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Aspect</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Record</th>
                      <th scope="col" className="py-2 font-medium text-al-text-primary">Practice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INHABIT_THE_ARCHITECTURE_HELP_COMPARISON_ROWS.map((row) => (
                      <tr
                        key={row.aspect}
                        className="border-b border-neutral-100 dark:border-neutral-800/80"
                        data-testid={`help-inhabit-the-architecture-comparison-row-${row.aspect.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <th scope="row" className="py-2 pr-4 font-medium text-al-text-primary">{row.aspect}</th>
                        <td className="py-2 pr-4 text-al-text-secondary">{row.record}</td>
                        <td className="py-2 text-al-text-secondary">{row.practice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="record-simulator-incomplete" className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <HelpSectionHeading id="record-simulator-incomplete" showPermalink>
                Record on Simulator host
              </HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-inhabit-the-architecture-record-simulator">
                {INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY}
              </p>
            </section>

            <section aria-labelledby="sketch-is-practice" className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <HelpSectionHeading id="sketch-is-practice" showPermalink>
                {INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_TITLE}
              </HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-inhabit-the-architecture-sketch-practice">
                {INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_BODY}
              </p>
            </section>

            <section
              aria-labelledby="practice-cannot-promote"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inhabit-the-architecture-practice-cannot-promote"
            >
              <HelpSectionHeading id="practice-cannot-promote" showPermalink>
                {INHABIT_THE_ARCHITECTURE_HELP_PRACTICE_CANNOT_PROMOTE_TITLE}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{INHABIT_THE_ARCHITECTURE_HELP_PRACTICE_CANNOT_PROMOTE_BODY}</p>
            </section>

            <section
              aria-labelledby="sealing-path"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inhabit-the-architecture-sealing-path"
            >
              <HelpSectionHeading id="sealing-path" showPermalink>Sealing path honesty</HelpSectionHeading>
              <p className={readingBodyClass}>{INHABIT_THE_ARCHITECTURE_HELP_SEALING_PATH_BODY}</p>
              <p className={readingBodyClass}>
                <Link className={OPERATOR_LINK.inline} href={INHABIT_THE_ARCHITECTURE_HELP_SEALING_PATH_HREF}>
                  Sealed record vs decision register →
                </Link>
              </p>
            </section>

            <section
              aria-labelledby="help-inhabit-the-architecture-technical-mapping"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inhabit-the-architecture-technical-mapping"
            >
              <HelpSectionHeading id="help-inhabit-the-architecture-technical-mapping" showPermalink>
                Technical mapping and ADRs
              </HelpSectionHeading>
              <p className={readingBodyClass}>{INHABIT_THE_ARCHITECTURE_HELP_TECHNICAL_MAPPING_INTRO}</p>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {INHABIT_THE_ARCHITECTURE_HELP_ADR_REFERENCES.map((adr) => (
                  <li key={adr.id} className="text-al-text-secondary">
                    <span className="font-medium text-al-text-primary">ADR {adr.id}</span>
                    <span className="text-al-text-secondary"> — {adr.path}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-inhabit-the-architecture-keyboard-shortcut"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="help-inhabit-the-architecture-keyboard-shortcut" showPermalink>
                Keyboard shortcut
              </HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-inhabit-the-architecture-keyboard-shortcut">
                {INHABIT_THE_ARCHITECTURE_HELP_KEYBOARD_SHORTCUT_BODY}
              </p>
            </section>

            <section
              aria-labelledby="help-inhabit-the-architecture-mid-analysis"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inhabit-the-architecture-mid-analysis"
            >
              <HelpSectionHeading id="help-inhabit-the-architecture-mid-analysis" showPermalink>
                Mid-analysis review-type change
              </HelpSectionHeading>
              <p className={readingBodyClass}>{INHABIT_THE_ARCHITECTURE_HELP_MID_ANALYSIS_BODY}</p>
            </section>

            <section
              aria-labelledby="where-to-go-next"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inhabit-the-architecture-sources"
            >
              <HelpSectionHeading id="where-to-go-next" showPermalink>Where to go next</HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {INHABIT_THE_ARCHITECTURE_HELP_SOURCES_ACTIONS.map((source) => (
                  <li key={source.href}>
                    <Link className={OPERATOR_LINK.nav} href={source.href}>
                      {source.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby={INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inhabit-the-architecture-related-topics"
            >
              <HelpSectionHeading id={INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS_HEADING_ID} showPermalink>
                {INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS_HEADING}
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS.map((topic) => (
                  <li key={topic.href}>
                    <Link className={OPERATOR_LINK.nav} href={topic.href}>
                      {topic.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className={readingBodyClass}>
                <Link
                  className={OPERATOR_LINK.inline}
                  href={INHABIT_THE_ARCHITECTURE_HELP_HELP_RETURN.href}
                  data-testid="help-inhabit-the-architecture-return-to-help"
                >
                  {INHABIT_THE_ARCHITECTURE_HELP_HELP_RETURN.label} →
                </Link>
              </p>
            </section>

            <SponsorSendPathHonestyPanel testIdPrefix="help-inhabit-the-architecture" showSsoOptional={false} />
          </div>

          <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
        </div>
      </div>
    </article>
  );
}
