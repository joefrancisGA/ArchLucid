import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { AdvisoryScansHelpEvidenceOrientationStrip } from "@/components/help/AdvisoryScansHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EVIDENCE_CLAIM_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ADVISORY_SCANS_HELP_AI_USAGE_DISCLOSURE_LEAD,
  ADVISORY_SCANS_HELP_AI_USAGE_DISCLOSURE_TAIL,
  ADVISORY_SCANS_HELP_AI_USAGE_LINK,
  ADVISORY_SCANS_HELP_BEFORE_YOU_START_BODY,
  ADVISORY_SCANS_HELP_BEFORE_YOU_START_HEADING_ID,
  ADVISORY_SCANS_HELP_BEFORE_YOU_START_TITLE,
  ADVISORY_SCANS_HELP_CLAIM_HEADING_ID,
  ADVISORY_SCANS_HELP_DISPOSITION_ACTIONS,
  ADVISORY_SCANS_HELP_DISPOSITION_AUDIT_NOTE,
  ADVISORY_SCANS_HELP_DISPOSITION_HEADING_ID,
  ADVISORY_SCANS_HELP_DISPOSITION_SECTION_TITLE,
  ADVISORY_SCANS_HELP_GUIDE_HEADINGS,
  ADVISORY_SCANS_HELP_HOW_DERIVATION_SENTENCE,
  ADVISORY_SCANS_HELP_HOW_SECTION_HEADING_ID,
  ADVISORY_SCANS_HELP_HOW_TO_READ_STEPS,
  ADVISORY_SCANS_HELP_OUTPUT_FIELDS,
  ADVISORY_SCANS_HELP_OVERVIEW,
  ADVISORY_SCANS_HELP_PAGE_EYEBROW,
  ADVISORY_SCANS_HELP_PAGE_SUBTITLE,
  ADVISORY_SCANS_HELP_PAGE_TITLE,
  ADVISORY_SCANS_HELP_PRIMARY_ACTION,
  ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_HEADING_ID,
  ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_TITLE,
  ADVISORY_SCANS_HELP_SAMPLE_RECOMMENDATION_LINK,
  ADVISORY_SCANS_HELP_START_HERE_CARD_TITLE,
  ADVISORY_SCANS_HELP_START_HERE_HEADING_ID,
  ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK,
  ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE_LEAD,
  ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE_TAIL,
  ADVISORY_SCANS_HELP_SUMMARY_METRICS,
  ADVISORY_SCANS_HELP_SUMMARY_SECTION_TITLE,
  ADVISORY_SCANS_HELP_TILE_ITEMS,
  ADVISORY_SCANS_HELP_TROUBLESHOOTING,
  ADVISORY_SCANS_HELP_TROUBLESHOOTING_HEADING_ID,
  ADVISORY_SCANS_HELP_TROUBLESHOOTING_TITLE,
  ADVISORY_SCANS_HELP_WHAT_SHOWS_HEADING_ID,
  ADVISORY_SCANS_HELP_WHAT_SHOWS_SECTION_TITLE,
  type AdvisoryScansHelpHowToReadStep,
  type AdvisoryScansHelpTroubleshootingItem,
} from "@/lib/advisory-scans-help-guide-content";
import {
  ADVISORY_SCANS_HELP_CANONICAL_PATH,
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING,
  ADVISORY_SCANS_HELP_TOPIC_LABEL,
} from "@/lib/advisory-scans-help-evidence-copy";
import {
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAdvisoryScansGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0")}
    >
      {props.children}
    </h2>
  );
}

function advisoryScansHowToReadStepKey(step: AdvisoryScansHelpHowToReadStep): string {
  return step.parts
    .map((part) => (part.type === "text" ? part.value : `${part.label}:${part.href}`))
    .join("");
}

function AdvisoryScansHowToReadStepItem(props: { readonly step: AdvisoryScansHelpHowToReadStep }): React.ReactElement {
  const { step } = props;

  return (
    <>
      {step.parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={`text-${index}`}>{part.value}</span>;
        }

        return (
          <Link key={`link-${part.href}`} className={OPERATOR_LINK.nav} href={part.href}>
            {part.label}
          </Link>
        );
      })}
    </>
  );
}

function AdvisoryScansStartHereScopeNote(): React.ReactElement {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="help-advisory-scans-start-here-scope-note"
    >
      {ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE_LEAD}
      <Link className={OPERATOR_LINK.nav} href={ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK.href}>
        {ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK.label}
      </Link>
      {ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE_TAIL}
    </p>
  );
}

function AdvisoryScansTroubleshootingList(): React.ReactElement {
  return (
    <ul className="m-0 list-none space-y-2 p-0" data-testid="help-advisory-scans-troubleshooting">
      {ADVISORY_SCANS_HELP_TROUBLESHOOTING.map((item: AdvisoryScansHelpTroubleshootingItem) => (
        <li key={item.issue}>
          <details className={cn(DESIGN_TOKENS.surface.card, "group p-3")}>
            <summary
              className={cn(
                "cursor-pointer list-none font-semibold text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden",
                OPERATOR_TYPOGRAPHY.cardTitle,
              )}
            >
              {item.issue}
            </summary>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
              {item.resolution}
              {item.href !== undefined && item.linkLabel !== undefined ? (
                <>
                  {" "}
                  <Link href={item.href} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                    {item.linkLabel}
                  </Link>
                  .
                </>
              ) : null}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}

/** Advisory scans orientation for `/help/advisory-scans`. */
export function HelpAdvisoryScansGuideView(props: HelpAdvisoryScansGuideViewProps): React.ReactElement {
  const { entry } = props;
  const showSectionNav = ADVISORY_SCANS_HELP_GUIDE_HEADINGS.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(ADVISORY_SCANS_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-advisory-scans-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        eyebrow={ADVISORY_SCANS_HELP_PAGE_EYEBROW}
        title={ADVISORY_SCANS_HELP_PAGE_TITLE}
        titleTestId="help-advisory-scans-page-title"
        subtitle={ADVISORY_SCANS_HELP_PAGE_SUBTITLE}
        navHref={ADVISORY_SCANS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      {showSectionNav ? (
        <HelpTopicTableOfContents headings={ADVISORY_SCANS_HELP_GUIDE_HEADINGS} placement="header-inline" />
      ) : null}

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-advisory-scans-overview">
            {ADVISORY_SCANS_HELP_OVERVIEW}
          </p>

          <section aria-labelledby={ADVISORY_SCANS_HELP_CLAIM_HEADING_ID} className="space-y-3">
            <HelpSectionHeading id={ADVISORY_SCANS_HELP_CLAIM_HEADING_ID}>
              {ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING}
            </HelpSectionHeading>
            <EvidenceOrientationClaimCallout
              testId="help-advisory-scans-claim-discipline"
              body={ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE}
              style={EVIDENCE_CLAIM_STYLE.operatorNeutral}
              element="div"
              bodyClassName={HELP_PAGE_LAYOUT.readingBody}
            />
          </section>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-advisory-scans-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle
                as="h2"
                id={ADVISORY_SCANS_HELP_START_HERE_HEADING_ID}
                className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                {ADVISORY_SCANS_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <Button asChild size="sm" variant="primary" data-testid="help-advisory-scans-start-here-primary-cta">
                <Link href={ADVISORY_SCANS_HELP_PRIMARY_ACTION.href}>{ADVISORY_SCANS_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
              <AdvisoryScansStartHereScopeNote />
            </CardContent>
          </Card>

          <section
            aria-labelledby={ADVISORY_SCANS_HELP_BEFORE_YOU_START_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={ADVISORY_SCANS_HELP_BEFORE_YOU_START_HEADING_ID}>
              {ADVISORY_SCANS_HELP_BEFORE_YOU_START_TITLE}
            </HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-advisory-scans-before-you-start">
              {ADVISORY_SCANS_HELP_BEFORE_YOU_START_BODY}{" "}
              <Link className={OPERATOR_LINK.nav} href={ADVISORY_SCANS_HELP_SAMPLE_RECOMMENDATION_LINK.href}>
                {ADVISORY_SCANS_HELP_SAMPLE_RECOMMENDATION_LINK.label}
              </Link>
              .
            </p>
          </section>

          <section
            aria-labelledby={ADVISORY_SCANS_HELP_WHAT_SHOWS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={ADVISORY_SCANS_HELP_WHAT_SHOWS_HEADING_ID}>
              {ADVISORY_SCANS_HELP_WHAT_SHOWS_SECTION_TITLE}
            </HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-advisory-scans-output-fields"
            >
              {ADVISORY_SCANS_HELP_OUTPUT_FIELDS.map((field) => (
                <div key={field.label}>
                  <dt className="font-medium text-al-text-primary">{field.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{field.detail}</dd>
                </div>
              ))}
            </dl>
            <div className="space-y-2">
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{ADVISORY_SCANS_HELP_SUMMARY_SECTION_TITLE}</h3>
              <dl
                className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-advisory-scans-summary-metrics"
              >
                {ADVISORY_SCANS_HELP_SUMMARY_METRICS.map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                    <dt className="font-medium text-al-text-primary">{metric.label}</dt>
                    <dd className="m-0 text-al-text-secondary">{metric.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section
            aria-labelledby={ADVISORY_SCANS_HELP_DISPOSITION_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={ADVISORY_SCANS_HELP_DISPOSITION_HEADING_ID}>
              {ADVISORY_SCANS_HELP_DISPOSITION_SECTION_TITLE}
            </HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-advisory-scans-disposition-actions"
            >
              {ADVISORY_SCANS_HELP_DISPOSITION_ACTIONS.map((action) => (
                <div key={action.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                  <dt className="font-medium text-al-text-primary">{action.label}</dt>
                  <dd className="m-0 text-al-text-secondary">{action.hint}</dd>
                </div>
              ))}
            </dl>
            <p className={readingBodyClass} data-testid="help-advisory-scans-disposition-audit-note">
              {ADVISORY_SCANS_HELP_DISPOSITION_AUDIT_NOTE}
            </p>
          </section>

          <section
            aria-labelledby={ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_HEADING_ID}>
              {ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_TITLE}
            </HelpSectionHeading>
            <ul
              className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-advisory-scans-tile-items"
            >
              {ADVISORY_SCANS_HELP_TILE_ITEMS.map((item) => (
                <li key={item.label} className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                  <Link className={cn("font-medium", OPERATOR_LINK.nav)} href={item.href}>
                    {item.label}
                  </Link>
                  <p className="m-0 mt-1 text-al-text-secondary">{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby={ADVISORY_SCANS_HELP_HOW_SECTION_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={ADVISORY_SCANS_HELP_HOW_SECTION_HEADING_ID}>
              {ADVISORY_SCANS_HELP_TOPIC_LABEL}
            </HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-advisory-scans-how-derivation">
              {ADVISORY_SCANS_HELP_HOW_DERIVATION_SENTENCE}
            </p>
            <p className={readingBodyClass} data-testid="help-advisory-scans-ai-usage-disclosure">
              {ADVISORY_SCANS_HELP_AI_USAGE_DISCLOSURE_LEAD}{" "}
              <Link className={OPERATOR_LINK.nav} href={ADVISORY_SCANS_HELP_AI_USAGE_LINK.href}>
                {ADVISORY_SCANS_HELP_AI_USAGE_LINK.label}
              </Link>
              {ADVISORY_SCANS_HELP_AI_USAGE_DISCLOSURE_TAIL}
            </p>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-advisory-scans-how-stepper"
            >
              {ADVISORY_SCANS_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={advisoryScansHowToReadStepKey(step)}>
                  <AdvisoryScansHowToReadStepItem step={step} />
                </li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby={ADVISORY_SCANS_HELP_TROUBLESHOOTING_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={ADVISORY_SCANS_HELP_TROUBLESHOOTING_HEADING_ID}>
              {ADVISORY_SCANS_HELP_TROUBLESHOOTING_TITLE}
            </HelpSectionHeading>
            <AdvisoryScansTroubleshootingList />
          </section>

          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <AdvisoryScansHelpEvidenceOrientationStrip />
          </div>
        </div>

        {showSectionNav ? (
          <HelpTopicTableOfContents
            headings={ADVISORY_SCANS_HELP_GUIDE_HEADINGS}
            enableScrollSpy
            placement="sidebar"
          />
        ) : null}
      </div>
    </article>
  );
}
