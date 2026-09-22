import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
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
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CLAIM_DISCIPLINE,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_HEADING_ID,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOURCES,
} from "@/lib/livelihood-grade-no-help-false-hard-evidence-copy";
import {
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_DOOR,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_GUIDED,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_SECURENOW,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_WORKING,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ADR_REFERENCES,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CITATION_REMEDIATION_HEADING,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CITATION_REMEDIATION_STEPS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ENFORCEMENT_SURFACES,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_FEASIBILITY_PURPOSE_LINKS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_HELP_RETURN,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_KEYBOARD_SHORTCUTS_BODY,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_KEYBOARD_SHORTCUTS_HREF,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW_LEAD,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SCOPE,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SUBTITLE,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS_HEADING,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS_HEADING_ID,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_BODY,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_STATUS_TAG,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_TITLE,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_FIELD_ROWS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_HEADING,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_INTRO,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_TITLE,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_VERDICT_VOCABULARY_ROWS,
} from "@/lib/livelihood-grade-no-help-false-hard-guide-content";
import {
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_FIRST_VIEWPORT_TEST_ID,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_TEST_ID,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PRIMARY_CONTENT_ID,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SKIP_LINK_LABEL,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SKIP_TARGET_ID,
} from "@/lib/livelihood-grade-no-help-false-hard-page-copy";
import { LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH } from "@/lib/livelihood-grade-no-help-route";
import { LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS } from "@/lib/livelihood-grade-no-hard-infeasible-inventory";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpFalseHardInfeasibilityGuideViewProps = {
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

/** LN-024 — Working help for hard vs soft infeasibility on Career export. */
export function HelpFalseHardInfeasibilityGuideView(
  props: HelpFalseHardInfeasibilityGuideViewProps,
): React.ReactElement {
  void props.markdown;
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_TEST_ID}
    >
      <a
        href={`#${LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <div
        id={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PRIMARY_CONTENT_ID}
        data-testid={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_TITLE}
          titleTestId="help-false-hard-infeasibility-page-title"
          subtitle={
            <>
              <p className="m-0">{LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SUBTITLE}</p>
              <p
                className="m-0 mt-2 text-al-text-secondary"
                data-testid="help-false-hard-infeasibility-page-scope"
              >
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SCOPE}
              </p>
            </>
          }
          subtitleClassName="max-w-3xl"
          navHref={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH}
          headingLevel="h1"
          claimDiscipline={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CLAIM_DISCIPLINE}
          claimDisciplineTestId={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        />

        <div
          id={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SKIP_TARGET_ID}
          data-testid={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-false-hard-infeasibility-overview">
            {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW_LEAD}
          </p>

          <section
            aria-labelledby={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_HEADING_ID}
            className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-false-hard-infeasibility-safety-callout"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_HEADING_ID}
                className={cn(
                  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                  "m-0 scroll-mt-24 text-al-text-primary",
                  OPERATOR_TYPOGRAPHY.sectionTitle,
                )}
              >
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_TITLE}
              </h2>
              <StatusTag
                kind="neutral"
                label={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_STATUS_TAG}
                data-testid="help-false-hard-infeasibility-safety-status-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-false-hard-infeasibility-safety-detail"
            >
              {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_BODY}
            </p>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            <section
              aria-labelledby="help-false-hard-infeasibility-applicability"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-applicability"
            >
              <HelpSectionHeading id="help-false-hard-infeasibility-applicability">
                Scope and seat applicability
              </HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-false-hard-infeasibility-seat-working">
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_WORKING}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-false-hard-infeasibility-seat-door"
              >
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_DOOR}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-false-hard-infeasibility-seat-guided"
              >
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_GUIDED}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-false-hard-infeasibility-seat-securenow"
              >
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_APPLICABILITY_SECURENOW}
              </p>
            </section>

            <section
              aria-labelledby="help-false-hard-infeasibility-verdict-vocabulary"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-verdict-vocabulary"
            >
              <HelpSectionHeading id="help-false-hard-infeasibility-verdict-vocabulary">
                Verdict vocabulary bridge
              </HelpSectionHeading>
              <p className={readingBodyClass}>
                FeasibilityVerdictKind maps to sponsor verdict tiers on desk and export surfaces — uncited hard uses the
                citation-needed label instead of Hold.
              </p>
              <div className="max-w-3xl overflow-x-auto">
                <table
                  className={cn("w-full border-collapse text-left", HELP_PAGE_LAYOUT.readingBody)}
                  data-testid="help-false-hard-infeasibility-vocabulary-table"
                >
                  <caption className="sr-only">Feasibility kind to verdict tier mapping</caption>
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Feasibility kind</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Verdict tier</th>
                      <th scope="col" className="py-2 font-medium text-al-text-primary">Desk label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_VERDICT_VOCABULARY_ROWS.map((row) => (
                      <tr
                        key={row.feasibilityKind}
                        className="border-b border-neutral-100 dark:border-neutral-800/80"
                        data-testid={`help-false-hard-infeasibility-vocabulary-row-${row.feasibilityKind.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        <th scope="row" className="py-2 pr-4 font-medium text-al-text-primary">{row.feasibilityKind}</th>
                        <td className="py-2 pr-4 text-al-text-secondary">{row.verdictTier}</td>
                        <td className="py-2 text-al-text-secondary">{row.uiLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              aria-labelledby="help-false-hard-infeasibility-soft-envelope"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-soft-envelope"
            >
              <HelpSectionHeading id="help-false-hard-infeasibility-soft-envelope">
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_HEADING}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_INTRO}</p>
              <ul className={cn("m-0 max-w-3xl list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_FIELD_ROWS.map((field) => (
                  <li key={field.fieldPath} className="text-al-text-secondary">
                    <span className="font-medium text-al-text-primary">{field.fieldPath}</span>
                    <span> — {field.meaning}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-false-hard-infeasibility-citation-remediation"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-citation-remediation"
            >
              <HelpSectionHeading id="help-false-hard-infeasibility-citation-remediation">
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CITATION_REMEDIATION_HEADING}
              </HelpSectionHeading>
              <ol className={cn("m-0 max-w-3xl list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CITATION_REMEDIATION_STEPS.map((step) => (
                  <li key={step} className="text-al-text-secondary">{step}</li>
                ))}
              </ol>
            </section>

            <section
              aria-labelledby="help-false-hard-infeasibility-enforcement-surfaces"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-enforcement-surfaces"
            >
              <HelpSectionHeading id="help-false-hard-infeasibility-enforcement-surfaces">
                Enforcement surfaces
              </HelpSectionHeading>
              <p className={readingBodyClass}>
                Shrink-only inventory from LN-002 — five surfaces that enforce citation before Working Career export.
              </p>
              <div className="max-w-3xl overflow-x-auto">
                <table
                  className={cn("w-full border-collapse text-left", HELP_PAGE_LAYOUT.readingBody)}
                  data-testid="help-false-hard-infeasibility-enforcement-table"
                >
                  <caption className="sr-only">Hard infeasible citation enforcement on Working Career</caption>
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Surface</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Field path</th>
                      <th scope="col" className="py-2 font-medium text-al-text-primary">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS.map((row) => (
                      <tr
                        key={row.fieldPath}
                        className="border-b border-neutral-100 dark:border-neutral-800/80"
                        data-testid={`help-false-hard-infeasibility-enforcement-row-${row.ownerPrompt.toLowerCase()}`}
                      >
                        <th scope="row" className="py-2 pr-4 font-medium text-al-text-primary">{row.surface}</th>
                        <td className="py-2 pr-4 font-mono text-sm text-al-text-secondary">{row.fieldPath}</td>
                        <td className="py-2 text-al-text-secondary">{row.ownerPrompt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className={cn("m-0 list-none space-y-3 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ENFORCEMENT_SURFACES.map((surface) => (
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
              aria-labelledby="help-false-hard-infeasibility-adr-mapping"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-adr-mapping"
            >
              <HelpSectionHeading id="help-false-hard-infeasibility-adr-mapping">ADR 0093 and LN-024</HelpSectionHeading>
              <p className={readingBodyClass}>
                LN-024 publishes this help topic. ADR 0093 records the Working Career false-hard citation contract —
                uncited hard is demoted or withheld on export and does not replace ADR 0082 structural provenance.
              </p>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ADR_REFERENCES.map((adr) => (
                  <li key={adr.id} className="text-al-text-secondary">
                    <span className="font-medium text-al-text-primary">ADR {adr.id}</span>
                    <span className="text-al-text-secondary"> — {adr.path}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-false-hard-infeasibility-feasibility-links"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-feasibility-links"
            >
              <HelpSectionHeading id="help-false-hard-infeasibility-feasibility-links">
                Purpose-specific feasibility links
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-3 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_FEASIBILITY_PURPOSE_LINKS.map((link) => (
                  <li key={link.href} className="max-w-3xl">
                    <Link className={OPERATOR_LINK.nav} href={link.href}>
                      {link.label}
                    </Link>
                    <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {link.description}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-false-hard-infeasibility-keyboard-shortcuts"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-keyboard-shortcuts"
            >
              <HelpSectionHeading id="help-false-hard-infeasibility-keyboard-shortcuts">
                Keyboard shortcuts
              </HelpSectionHeading>
              <p className={readingBodyClass}>{LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_KEYBOARD_SHORTCUTS_BODY}</p>
              <p className={readingBodyClass}>
                <Link
                  className={OPERATOR_LINK.inline}
                  href={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_KEYBOARD_SHORTCUTS_HREF}
                  data-testid="help-false-hard-infeasibility-open-keyboard-shortcuts"
                >
                  Open keyboard shortcuts on this topic →
                </Link>
              </p>
            </section>

            <section
              aria-labelledby="help-false-hard-infeasibility-where-to-go-next"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-sources"
            >
              <HelpSectionHeading id="help-false-hard-infeasibility-where-to-go-next">Where to go next</HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOURCES.map((source) => (
                  <li key={source.href}>
                    <Link className={OPERATOR_LINK.nav} href={source.href}>
                      {source.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-false-hard-infeasibility-related-topics"
            >
              <HelpSectionHeading id={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS_HEADING_ID}>
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS_HEADING}
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_RELATED_TOPICS.map((topic) => (
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
                  href={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_HELP_RETURN.href}
                  data-testid="help-false-hard-infeasibility-return-to-help"
                >
                  {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_HELP_RETURN.label} →
                </Link>
              </p>
            </section>

            <SponsorSendPathHonestyPanel testIdPrefix="help-false-hard-infeasibility" showSsoOptional={false} />
          </div>

          <HelpTopicTableOfContents
            headings={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS}
            enableScrollSpy
          />
        </div>
      </div>
    </article>
  );
}
