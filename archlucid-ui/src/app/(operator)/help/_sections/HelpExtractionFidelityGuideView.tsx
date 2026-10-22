"use client";

import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { StatusTag } from "@/components/ui/status-tag";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import {
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_CLAIM_DISCIPLINE,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_HEADING_ID,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TOPIC_LABEL,
  livelihoodGradeNoHelpExtractionFidelitySources,
} from "@/lib/livelihood-grade-no-help-extraction-fidelity-evidence-copy";
import {
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ADR_REFERENCES,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_APPLICABILITY_GUIDED,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_APPLICABILITY_SECURENOW,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_APPLICABILITY_WORKING,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ENFORCEMENT_SURFACES,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_HELP_RETURN,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW_LEAD,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PAGE_SUBTITLE,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS_HEADING,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS_HEADING_ID,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RULES,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RULES_HEADING,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_BODY,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_STATUS_TAG,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_TITLE,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TITLE,
} from "@/lib/livelihood-grade-no-help-extraction-fidelity-guide-content";
import {
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_FIRST_VIEWPORT_TEST_ID,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_TEST_ID,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PRIMARY_CONTENT_ID,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SKIP_LINK_LABEL,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SKIP_TARGET_ID,
} from "@/lib/livelihood-grade-no-help-extraction-fidelity-page-copy";
import { LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH } from "@/lib/livelihood-grade-no-help-route";
import { LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_ROWS } from "@/lib/livelihood-grade-no-extraction-provenance-inventory";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpExtractionFidelityGuideViewProps = {
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

/** LN-034 — Working help for extraction fidelity and NotVerifiable diagram honesty. */
export function HelpExtractionFidelityGuideView(
  props: HelpExtractionFidelityGuideViewProps,
): React.ReactElement {
  void props.markdown;
  const { entry } = props;
  const { productLine } = useProductLine();
  const sources = livelihoodGradeNoHelpExtractionFidelitySources(productLine);
  const contentGridClass = resolveHelpPageContentGridClass(
    LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS.length,
  );
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_TEST_ID}
    >
      <a
        href={`#${LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <div
        id={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PRIMARY_CONTENT_ID}
        data-testid={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TITLE}
          titleTestId="help-extraction-fidelity-page-title"
          subtitle={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PAGE_SUBTITLE}
          navHref={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH}
          headingLevel="h1"
          claimDiscipline={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_CLAIM_DISCIPLINE}
          claimDisciplineTestId={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          breadcrumb={<HelpTopicBreadcrumb topicTitle={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TOPIC_LABEL} />}
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        />

        <div
          id={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SKIP_TARGET_ID}
          data-testid={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-extraction-fidelity-overview">
            {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW_LEAD}
          </p>

          <section
            aria-labelledby={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_HEADING_ID}
            className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-extraction-fidelity-safety-callout"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_HEADING_ID}
                className={cn(
                  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                  "m-0 scroll-mt-24 text-al-text-primary",
                  OPERATOR_TYPOGRAPHY.sectionTitle,
                )}
              >
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_TITLE}
              </h2>
              <StatusTag
                kind="neutral"
                label={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_STATUS_TAG}
                data-testid="help-extraction-fidelity-safety-status-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-extraction-fidelity-safety-detail"
            >
              {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_BODY}
            </p>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            <section
              aria-labelledby="help-extraction-fidelity-applicability"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-extraction-fidelity-applicability"
            >
              <HelpSectionHeading id="help-extraction-fidelity-applicability">
                Scope and seat applicability
              </HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-extraction-fidelity-seat-working">
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_APPLICABILITY_WORKING}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-extraction-fidelity-seat-guided"
              >
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_APPLICABILITY_GUIDED}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-extraction-fidelity-seat-securenow"
              >
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_APPLICABILITY_SECURENOW}
              </p>
            </section>

            <section
              aria-labelledby="help-extraction-fidelity-provenance-gaps"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="help-extraction-fidelity-provenance-gaps">
                Named provenance gaps
              </HelpSectionHeading>
              <p className={readingBodyClass}>
                Shrink-only inventory from LN-003 — surfaces where extraction-to-finding provenance can still fail
                before ADR 0082 gates fully ship.
              </p>
              <div className="max-w-3xl overflow-x-auto">
                <table
                  className={cn("w-full border-collapse text-left", HELP_PAGE_LAYOUT.readingBody)}
                  data-testid="help-extraction-fidelity-provenance-gap-table"
                >
                  <caption className="sr-only">Extraction provenance gaps on Working Career surfaces</caption>
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Surface</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Provenance gap</th>
                      <th scope="col" className="py-2 font-medium text-al-text-primary">Owner prompt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_ROWS.map((row) => (
                      <tr
                        key={row.surface}
                        className="border-b border-neutral-100 dark:border-neutral-800/80"
                        data-testid={`help-extraction-fidelity-provenance-gap-row-${row.ownerPrompt.toLowerCase()}`}
                      >
                        <th scope="row" className="py-2 pr-4 font-medium text-al-text-primary">{row.surface}</th>
                        <td className="py-2 pr-4 text-al-text-secondary">{row.provenanceGap}</td>
                        <td className="py-2 text-al-text-secondary">{row.ownerPrompt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              aria-labelledby="help-extraction-fidelity-enforcement-surfaces"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-extraction-fidelity-enforcement-surfaces"
            >
              <HelpSectionHeading id="help-extraction-fidelity-enforcement-surfaces">
                Enforcement surfaces
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-3 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ENFORCEMENT_SURFACES.map((surface) => (
                  <li key={surface.name} className="max-w-3xl">
                    <Link className={OPERATOR_LINK.nav} href={surface.href}>
                      {surface.name}
                    </Link>
                    <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {surface.description}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-extraction-fidelity-extraction-rules"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-extraction-fidelity-extraction-rules"
            >
              <HelpSectionHeading id="help-extraction-fidelity-extraction-rules">
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RULES_HEADING}
              </HelpSectionHeading>
              <ul className={cn("m-0 max-w-3xl list-disc space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RULES.map((rule) => (
                  <li key={rule} className="text-al-text-secondary">{rule}</li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-extraction-fidelity-adr-mapping"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-extraction-fidelity-adr-mapping"
            >
              <HelpSectionHeading id="help-extraction-fidelity-adr-mapping">ADR 0082 and LN-034</HelpSectionHeading>
              <p className={readingBodyClass}>
                LN-034 publishes this help topic. ADR 0082 records the structural provenance fail-closed contract —
                Kind A (typed) or Kind B (agent) before decision-grade rows persist on Working Real paths.
              </p>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ADR_REFERENCES.map((adr) => (
                  <li key={adr.id} className="text-al-text-secondary">
                    <span className="font-medium text-al-text-primary">ADR {adr.id}</span>
                    <span className="text-al-text-secondary"> — {adr.path}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-extraction-fidelity-where-to-go-next"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-extraction-fidelity-sources"
            >
              <HelpSectionHeading id="help-extraction-fidelity-where-to-go-next">Where to go next</HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {sources.map((source) => (
                  <li key={source.href}>
                    <Link className={OPERATOR_LINK.nav} href={source.href}>
                      {source.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-extraction-fidelity-related-topics"
            >
              <HelpSectionHeading id={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS_HEADING_ID}>
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS_HEADING}
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS.map((topic) => (
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
                  href={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_HELP_RETURN.href}
                  data-testid="help-extraction-fidelity-return-to-help"
                >
                  {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_HELP_RETURN.label} →
                </Link>
              </p>
            </section>
          </div>

          <HelpTopicTableOfContents
            headings={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS}
            enableScrollSpy
          />
        </div>
      </div>
    </article>
  );
}
