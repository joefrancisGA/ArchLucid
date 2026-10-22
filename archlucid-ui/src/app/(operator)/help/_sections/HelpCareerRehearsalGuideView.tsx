import Link from "next/link";

import { HelpCareerRehearsalHeaderActions } from "@/app/(operator)/help/_sections/HelpCareerRehearsalHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { StatusTag } from "@/components/ui/status-tag";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  CAREER_REHEARSAL_HELP_CANONICAL_PATH,
  CAREER_REHEARSAL_HELP_CLAIM_DISCIPLINE,
  CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID,
  CAREER_REHEARSAL_HELP_SOURCES,
  CAREER_REHEARSAL_HELP_TOPIC_LABEL,
} from "@/lib/career-rehearsal-help-evidence-copy";
import {
  CAREER_REHEARSAL_HELP_APPLICABILITY_GUIDED,
  CAREER_REHEARSAL_HELP_APPLICABILITY_SECURENOW,
  CAREER_REHEARSAL_HELP_APPLICABILITY_WORKING,
  CAREER_REHEARSAL_HELP_ADR_REFERENCES,
  CAREER_REHEARSAL_HELP_COMPARISON_ROWS,
  CAREER_REHEARSAL_HELP_GUIDE_HEADINGS,
  CAREER_REHEARSAL_HELP_HELP_RETURN,
  CAREER_REHEARSAL_HELP_KEYBOARD_SHORTCUT_BODY,
  CAREER_REHEARSAL_HELP_MID_ANALYSIS_BODY,
  CAREER_REHEARSAL_HELP_OVERVIEW,
  CAREER_REHEARSAL_HELP_PAGE_SUBTITLE,
  CAREER_REHEARSAL_HELP_PAGE_TITLE,
  CAREER_REHEARSAL_HELP_RELATED_TOPICS,
  CAREER_REHEARSAL_HELP_RELATED_TOPICS_HEADING,
  CAREER_REHEARSAL_HELP_RELATED_TOPICS_HEADING_ID,
  CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY,
  CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE,
  CAREER_REHEARSAL_HELP_SIMULATOR_STATUS_TAG,
  CAREER_REHEARSAL_HELP_SIBLING_TOPIC_BODY,
  CAREER_REHEARSAL_HELP_SIBLING_TOPIC_LABEL,
  CAREER_REHEARSAL_HELP_SIBLING_TOPIC_HREF,
  CAREER_REHEARSAL_HELP_SIBLING_TOPIC_TITLE,
} from "@/lib/career-rehearsal-help-guide-content";
import {
  CAREER_REHEARSAL_HELP_FIRST_VIEWPORT_TEST_ID,
  CAREER_REHEARSAL_HELP_GUIDE_TEST_ID,
  CAREER_REHEARSAL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CAREER_REHEARSAL_HELP_PRIMARY_CONTENT_ID,
  CAREER_REHEARSAL_HELP_SKIP_LINK_LABEL,
  CAREER_REHEARSAL_HELP_SKIP_TARGET_ID,
} from "@/lib/career-rehearsal-help-page-copy";
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

type HelpCareerRehearsalGuideViewProps = {
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

/** AS-082 — Career vs Rehearsal Working desk orientation for `/help/career-vs-rehearsal`. */
export function HelpCareerRehearsalGuideView(props: HelpCareerRehearsalGuideViewProps): React.ReactElement {
  void props.markdown;
  const { entry } = props;
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-career-vs-rehearsal",
    CAREER_REHEARSAL_HELP_GUIDE_HEADINGS,
    CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={CAREER_REHEARSAL_HELP_GUIDE_TEST_ID}
    >
      <a href={`#${CAREER_REHEARSAL_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {CAREER_REHEARSAL_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <div
        id={CAREER_REHEARSAL_HELP_PRIMARY_CONTENT_ID}
        data-testid={CAREER_REHEARSAL_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={CAREER_REHEARSAL_HELP_PAGE_TITLE}
          titleTestId="help-career-vs-rehearsal-page-title"
          subtitle={CAREER_REHEARSAL_HELP_PAGE_SUBTITLE}
          navHref={CAREER_REHEARSAL_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={CAREER_REHEARSAL_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={CAREER_REHEARSAL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          breadcrumb={<HelpTopicBreadcrumb topicTitle={CAREER_REHEARSAL_HELP_TOPIC_LABEL} />}
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
          actions={<HelpCareerRehearsalHeaderActions />}
        />

        <div
          id={CAREER_REHEARSAL_HELP_SKIP_TARGET_ID}
          data-testid={CAREER_REHEARSAL_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-career-vs-rehearsal-overview">
            {CAREER_REHEARSAL_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby={CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID}
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-career-vs-rehearsal-simulator-honesty"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID}
                className={cn(
                  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                  "m-0 scroll-mt-24 text-al-text-primary",
                  OPERATOR_TYPOGRAPHY.sectionTitle,
                )}
              >
                {CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE}
              </h2>
              <StatusTag
                kind="neutral"
                label={CAREER_REHEARSAL_HELP_SIMULATOR_STATUS_TAG}
                data-testid="help-career-vs-rehearsal-simulator-status-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-career-vs-rehearsal-simulator-honesty-detail"
            >
              {CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY}
            </p>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            <section
              aria-labelledby="help-career-vs-rehearsal-applicability"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-career-vs-rehearsal-applicability"
            >
              <HelpSectionHeading id="help-career-vs-rehearsal-applicability">Who sees the chooser</HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-career-vs-rehearsal-seat-working">
                {CAREER_REHEARSAL_HELP_APPLICABILITY_WORKING}
              </p>
              <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-career-vs-rehearsal-seat-guided">
                {CAREER_REHEARSAL_HELP_APPLICABILITY_GUIDED}
              </p>
              <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-career-vs-rehearsal-seat-securenow">
                {CAREER_REHEARSAL_HELP_APPLICABILITY_SECURENOW}
              </p>
            </section>

            <section
              aria-labelledby="help-career-vs-rehearsal-comparison"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="help-career-vs-rehearsal-comparison">Record vs Practice</HelpSectionHeading>
              <div className="max-w-3xl overflow-x-auto">
                <table
                  className={cn("w-full border-collapse text-left", HELP_PAGE_LAYOUT.readingBody)}
                  data-testid="help-career-vs-rehearsal-comparison-table"
                >
                  <caption className="sr-only">Record vs Practice review types on the Working desk</caption>
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Aspect</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Record</th>
                      <th scope="col" className="py-2 font-medium text-al-text-primary">Practice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CAREER_REHEARSAL_HELP_COMPARISON_ROWS.map((row) => (
                      <tr
                        key={row.aspect}
                        className="border-b border-neutral-100 dark:border-neutral-800/80"
                        data-testid={`help-career-vs-rehearsal-comparison-row-${row.aspect.toLowerCase().replace(/\s+/g, "-")}`}
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

            <section
              aria-labelledby="help-career-vs-rehearsal-technical-mapping"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-career-vs-rehearsal-technical-mapping"
            >
              <HelpSectionHeading id="help-career-vs-rehearsal-technical-mapping">
                Technical mapping and ADRs
              </HelpSectionHeading>
              <p className={readingBodyClass}>
                Preference and API fields keep <span className="font-medium text-al-text-primary">career</span> and{" "}
                <span className="font-medium text-al-text-primary">rehearsal</span> identifiers while the UI shows{" "}
                {CAREER_REHEARSAL_HELP_COMPARISON_ROWS[0]?.record} and {CAREER_REHEARSAL_HELP_COMPARISON_ROWS[0]?.practice}.
              </p>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CAREER_REHEARSAL_HELP_ADR_REFERENCES.map((adr) => (
                  <li key={adr.id} className="text-al-text-secondary">
                    <span className="font-medium text-al-text-primary">ADR {adr.id}</span>
                    <span className="text-al-text-secondary"> — {adr.path}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-career-vs-rehearsal-keyboard-shortcut"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="help-career-vs-rehearsal-keyboard-shortcut">Keyboard shortcut</HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-career-vs-rehearsal-keyboard-shortcut">
                {CAREER_REHEARSAL_HELP_KEYBOARD_SHORTCUT_BODY}
              </p>
            </section>

            <section
              aria-labelledby="help-career-vs-rehearsal-mid-analysis"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-career-vs-rehearsal-mid-analysis"
            >
              <HelpSectionHeading id="help-career-vs-rehearsal-mid-analysis">
                Mid-analysis review-type change
              </HelpSectionHeading>
              <p className={readingBodyClass}>{CAREER_REHEARSAL_HELP_MID_ANALYSIS_BODY}</p>
            </section>

            <section
              aria-labelledby="help-career-vs-rehearsal-sibling-topic"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-career-vs-rehearsal-sibling-topic"
            >
              <HelpSectionHeading id="help-career-vs-rehearsal-sibling-topic">
                {CAREER_REHEARSAL_HELP_SIBLING_TOPIC_TITLE}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{CAREER_REHEARSAL_HELP_SIBLING_TOPIC_BODY}</p>
              <p className={readingBodyClass}>
                <Link className={OPERATOR_LINK.inline} href={CAREER_REHEARSAL_HELP_SIBLING_TOPIC_HREF}>
                  {CAREER_REHEARSAL_HELP_SIBLING_TOPIC_LABEL} →
                </Link>
              </p>
            </section>

            <section
              aria-labelledby="help-career-vs-rehearsal-where-to-go-next"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-career-vs-rehearsal-sources"
            >
              <HelpSectionHeading id="help-career-vs-rehearsal-where-to-go-next">Where to go next</HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CAREER_REHEARSAL_HELP_SOURCES.map((source) => (
                  <li key={source.href}>
                    <Link className={OPERATOR_LINK.nav} href={source.href}>
                      {source.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby={CAREER_REHEARSAL_HELP_RELATED_TOPICS_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-career-vs-rehearsal-related-topics"
            >
              <HelpSectionHeading id={CAREER_REHEARSAL_HELP_RELATED_TOPICS_HEADING_ID}>
                {CAREER_REHEARSAL_HELP_RELATED_TOPICS_HEADING}
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CAREER_REHEARSAL_HELP_RELATED_TOPICS.map((topic) => (
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
                  href={CAREER_REHEARSAL_HELP_HELP_RETURN.href}
                  data-testid="help-career-vs-rehearsal-return-to-help"
                >
                  {CAREER_REHEARSAL_HELP_HELP_RETURN.label} →
                </Link>
              </p>
            </section>

            <SponsorSendPathHonestyPanel testIdPrefix="help-career-vs-rehearsal" showSsoOptional={false} />
          </div>

          <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
        </div>
      </div>
    </article>
  );
}
