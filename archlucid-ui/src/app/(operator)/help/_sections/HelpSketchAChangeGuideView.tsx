import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { StatusTag } from "@/components/ui/status-tag";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_ADR_REFERENCES,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_APPLICABILITY_GUIDED,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_APPLICABILITY_SECURENOW,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_APPLICABILITY_WORKING,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_ROWS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_HEADING,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_HEADINGS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_HELP_RETURN,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW_LEAD,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PAGE_SUBTITLE,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_ENVELOPE_BODY,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_ENVELOPE_TITLE,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_STATUS_TAG,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_HEADING,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS_HEADING,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS_HEADING_ID,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_BULLETS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_HEADING,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_INTRO,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SPONSOR_PANEL_SCOPE_LEAD_IN,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TECHNICAL_MAPPING_INTRO,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TITLE,
} from "@/lib/cheap-exploration-help-sketch-a-change-guide-content";
import {
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_DISCIPLINE,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_HEADING_ID,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SOURCES,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TOPIC_LABEL,
} from "@/lib/cheap-exploration-help-sketch-a-change-evidence-copy";
import {
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_FIRST_VIEWPORT_TEST_ID,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_TEST_ID,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRIMARY_CONTENT_ID,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SKIP_LINK_LABEL,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SKIP_TARGET_ID,
} from "@/lib/cheap-exploration-help-sketch-a-change-page-copy";
import { CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH } from "@/lib/cheap-exploration-help-sketch-a-change-route";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpSketchAChangeGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  /** Registry markdown is not rendered — guided view owns the body (TB-2238). */
  readonly markdown?: string;
};

function HelpSectionHeading(props: {
  readonly id: string;
  readonly level?: "h2" | "h3";
  readonly children: string;
}): React.ReactElement {
  const level = props.level ?? "h2";
  const className = cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    level === "h2" ? OPERATOR_TYPOGRAPHY.sectionTitle : OPERATOR_TYPOGRAPHY.cardTitle,
    "m-0 scroll-mt-24",
  );

  if (level === "h3") {
    return (
      <h3 id={props.id} className={className}>
        {props.children}
      </h3>
    );
  }

  return (
    <h2 id={props.id} className={className}>
      {props.children}
    </h2>
  );
}

/** CE-019 / HEK — how to sketch a labeled change on the architecture desk. */
export function HelpSketchAChangeGuideView(props: HelpSketchAChangeGuideViewProps): React.ReactElement {
  void props.markdown;
  const { entry } = props;
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-sketch-a-change",
    CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_HEADINGS,
    CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_TEST_ID}
    >
      <a
        href={`#${CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <div
        id={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRIMARY_CONTENT_ID}
        data-testid={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TITLE}
          titleTestId="help-sketch-a-change-page-title"
          subtitle={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PAGE_SUBTITLE}
          navHref={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH}
          headingLevel="h1"
          claimDiscipline={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_DISCIPLINE}
          claimDisciplineTestId={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          breadcrumb={<HelpTopicBreadcrumb topicTitle={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TOPIC_LABEL} />}
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        />

        <div
          id={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SKIP_TARGET_ID}
          data-testid={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-sketch-a-change-overview">
            {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW_LEAD}
          </p>

          <section
            aria-labelledby={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_HEADING_ID}
            className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-sketch-a-change-practice-envelope"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_HEADING_ID}
                className={cn(
                  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                  "m-0 scroll-mt-24 text-al-text-primary",
                  OPERATOR_TYPOGRAPHY.sectionTitle,
                )}
              >
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_ENVELOPE_TITLE}
              </h2>
              <StatusTag
                kind="neutral"
                label={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_STATUS_TAG}
                data-testid="help-sketch-a-change-practice-status-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-sketch-a-change-practice-envelope-detail"
            >
              {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_ENVELOPE_BODY}
            </p>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            <section
              aria-labelledby="help-sketch-a-change-applicability"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-sketch-a-change-applicability"
            >
              <HelpSectionHeading id="help-sketch-a-change-applicability">Scope and seat applicability</HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-sketch-a-change-seat-working">
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_APPLICABILITY_WORKING}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-sketch-a-change-seat-guided"
              >
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_APPLICABILITY_GUIDED}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-sketch-a-change-seat-securenow"
              >
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_APPLICABILITY_SECURENOW}
              </p>
            </section>

            <section
              aria-labelledby="help-sketch-a-change-record-practice"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-sketch-a-change-record-practice"
            >
              <HelpSectionHeading id="help-sketch-a-change-record-practice">
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_HEADING}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY}</p>
            </section>

            <section
              aria-labelledby="help-sketch-a-change-desk-entry"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-sketch-a-change-desk-entry"
            >
              <HelpSectionHeading id="help-sketch-a-change-desk-entry">
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_HEADING}
              </HelpSectionHeading>
              <div className="max-w-3xl overflow-x-auto">
                <table
                  className={cn("w-full border-collapse text-left", HELP_PAGE_LAYOUT.readingBody)}
                  data-testid="help-sketch-a-change-desk-entry-table"
                >
                  <caption className="sr-only">Sketch a change desk and palette entry surfaces</caption>
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">
                        Surface
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">
                        When
                      </th>
                      <th scope="col" className="py-2 font-medium text-al-text-primary">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_ROWS.map((row) => (
                      <tr
                        key={row.surface}
                        className="border-b border-neutral-100 dark:border-neutral-800/80"
                        data-testid={`help-sketch-a-change-desk-entry-row-${row.surface.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <th scope="row" className="py-2 pr-4 font-medium text-al-text-primary">
                          {row.surface}
                        </th>
                        <td className="py-2 pr-4 text-al-text-secondary">{row.when}</td>
                        <td className="py-2 text-al-text-secondary">{row.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              aria-labelledby="help-sketch-a-change-seal-compare"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-sketch-a-change-seal-compare"
            >
              <HelpSectionHeading id="help-sketch-a-change-seal-compare">
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_HEADING}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_INTRO}</p>
              <ul className={cn("m-0 list-disc space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_BULLETS.map((bullet) => (
                  <li key={bullet} className="text-al-text-secondary">
                    {bullet}
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-sketch-a-change-adr-mapping"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-sketch-a-change-adr-mapping"
            >
              <HelpSectionHeading id="help-sketch-a-change-adr-mapping">Technical mapping and ADRs</HelpSectionHeading>
              <p className={readingBodyClass}>{CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TECHNICAL_MAPPING_INTRO}</p>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_ADR_REFERENCES.map((adr) => (
                  <li key={adr.id} className="text-al-text-secondary">
                    <span className="font-medium text-al-text-primary">ADR {adr.id}</span>
                    <span className="text-al-text-secondary"> — {adr.path}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-sketch-a-change-where-to-go-next"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-sketch-a-change-sources"
            >
              <HelpSectionHeading id="help-sketch-a-change-where-to-go-next">Where to go next</HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SOURCES.map((source) => (
                  <li key={source.href}>
                    <Link className={OPERATOR_LINK.nav} href={source.href}>
                      {source.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-sketch-a-change-related-topics"
            >
              <HelpSectionHeading id={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS_HEADING_ID}>
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS_HEADING}
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS.map((topic) => (
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
                  href={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_HELP_RETURN.href}
                  data-testid="help-sketch-a-change-return-to-help"
                >
                  {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_HELP_RETURN.label} →
                </Link>
              </p>
            </section>

            <p
              className={cn(readingBodyClass, "text-al-text-secondary")}
              data-testid="help-sketch-a-change-sponsor-panel-scope-lead-in"
            >
              {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SPONSOR_PANEL_SCOPE_LEAD_IN}
            </p>

            <SponsorSendPathHonestyPanel testIdPrefix="help-sketch-a-change" showSsoOptional={false} />
          </div>

          <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
        </div>
      </div>
    </article>
  );
}
