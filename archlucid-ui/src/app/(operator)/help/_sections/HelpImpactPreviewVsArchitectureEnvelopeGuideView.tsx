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
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SOURCES,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TOPIC_LABEL,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-evidence-copy";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_REFERENCES,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_GUIDED,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_SECURENOW,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_WORKING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HELP_RETURN,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_BODY,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_HEADING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_BODY,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_TITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_STATUS_TAG,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_BODY,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_HEADING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_BODY,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_HEADING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-guide-content";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_FIRST_VIEWPORT_TEST_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_TEST_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PRIMARY_CONTENT_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_LINK_LABEL,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_TARGET_ID,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-page-copy";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-route";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import { MODE_GRAVITY_HELP_WHICH_MODE_PATH } from "@/lib/mode-gravity-help-route";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpImpactPreviewVsArchitectureEnvelopeGuideViewProps = {
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

/** CE-020 / EIM — impact preview vs architecture sketch envelope on the Working desk. */
export function HelpImpactPreviewVsArchitectureEnvelopeGuideView(
  props: HelpImpactPreviewVsArchitectureEnvelopeGuideViewProps,
): React.ReactElement {
  void props.markdown;
  const { entry } = props;
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-impact-preview-vs-architecture-envelope",
    CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS,
    CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_TEST_ID}
    >
      <a
        href={`#${CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <div
        id={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PRIMARY_CONTENT_ID}
        data-testid={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE}
          titleTestId="help-impact-preview-vs-envelope-page-title"
          subtitle={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE}
          navHref={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH}
          headingLevel="h1"
          claimDiscipline={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE}
          claimDisciplineTestId={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          breadcrumb={<HelpTopicBreadcrumb topicTitle={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TOPIC_LABEL} />}
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        />

        <div
          id={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_TARGET_ID}
          data-testid={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-impact-preview-vs-envelope-overview">
            {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD}
          </p>

          <section
            aria-labelledby={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID}
            className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-impact-preview-vs-envelope-policy-note"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID}
                className={cn(
                  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                  "m-0 scroll-mt-24 text-al-text-primary",
                  OPERATOR_TYPOGRAPHY.sectionTitle,
                )}
              >
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_TITLE}
              </h2>
              <StatusTag
                kind="neutral"
                label={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_STATUS_TAG}
                data-testid="help-impact-preview-vs-envelope-policy-status-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-impact-preview-vs-envelope-policy-detail"
            >
              {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_BODY}
            </p>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            <section
              aria-labelledby="help-impact-preview-vs-envelope-applicability"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-applicability"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-applicability">
                Scope and seat applicability
              </HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-impact-preview-vs-envelope-seat-working">
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_WORKING}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-impact-preview-vs-envelope-seat-guided"
              >
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_GUIDED}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-impact-preview-vs-envelope-seat-securenow"
              >
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_SECURENOW}
              </p>
            </section>

            <section
              aria-labelledby="help-impact-preview-vs-envelope-record-practice"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-record-practice"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-record-practice">
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_HEADING}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_BODY}</p>
            </section>

            <section
              aria-labelledby="help-impact-preview-vs-envelope-comparison"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-comparison">
                Impact preview vs Sketch a change
              </HelpSectionHeading>
              <div className="max-w-3xl overflow-x-auto">
                <table
                  className={cn("w-full border-collapse text-left", HELP_PAGE_LAYOUT.readingBody)}
                  data-testid="help-impact-preview-vs-envelope-comparison-table"
                >
                  <caption className="sr-only">
                    Impact preview policy envelope vs Sketch a change architecture envelope
                  </caption>
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">
                        Aspect
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">
                        Impact preview
                      </th>
                      <th scope="col" className="py-2 font-medium text-al-text-primary">
                        Sketch a change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS.map((row) => (
                      <tr
                        key={row.aspect}
                        className="border-b border-neutral-100 dark:border-neutral-800/80"
                        data-testid={`help-impact-preview-vs-envelope-comparison-row-${row.aspect.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <th scope="row" className="py-2 pr-4 font-medium text-al-text-primary">
                          {row.aspect}
                        </th>
                        <td className="py-2 pr-4 text-al-text-secondary">{row.impactPreview}</td>
                        <td className="py-2 text-al-text-secondary">{row.sketchAChange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              aria-labelledby="help-impact-preview-vs-envelope-contrasted-paths"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-contrasted-paths"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-contrasted-paths">Contrasted paths</HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-3 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS.map((path) => (
                  <li key={path.label} className="space-y-1">
                    <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{path.label}</p>
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{path.detail}</p>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                      <Link className={OPERATOR_LINK.nav} href={path.helpHref}>
                        Help topic
                      </Link>
                      {" · "}
                      <Link className={OPERATOR_LINK.nav} href={path.workspaceHref}>
                        Open workspace
                      </Link>
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-impact-preview-vs-envelope-r12"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-r12"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-r12">
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_HEADING}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_BODY}</p>
            </section>

            <section
              aria-labelledby="help-impact-preview-vs-envelope-mode-relation"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-mode-relation"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-mode-relation">
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_HEADING}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_BODY}</p>
              <p className={readingBodyClass}>
                <Link className={OPERATOR_LINK.inline} href={MODE_GRAVITY_HELP_WHICH_MODE_PATH}>
                  Which mode am I in? →
                </Link>
              </p>
            </section>

            <section
              aria-labelledby="help-impact-preview-vs-envelope-adr-mapping"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-adr-mapping"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-adr-mapping">
                Technical mapping and ADRs
              </HelpSectionHeading>
              <p className={readingBodyClass}>
                Stored review-type tokens stay{" "}
                <span className="font-medium text-al-text-primary">career</span> and{" "}
                <span className="font-medium text-al-text-primary">rehearsal</span> while the UI shows Record and
                Practice on the Working desk.
              </p>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_REFERENCES.map((adr) => (
                  <li key={adr.id} className="text-al-text-secondary">
                    <span className="font-medium text-al-text-primary">ADR {adr.id}</span>
                    <span className="text-al-text-secondary"> — {adr.path}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="help-impact-preview-vs-envelope-where-to-go-next"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-sources"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-where-to-go-next">Where to go next</HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SOURCES.map((source) => (
                  <li key={source.href}>
                    <Link className={OPERATOR_LINK.nav} href={source.href}>
                      {source.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-related-topics"
            >
              <HelpSectionHeading id={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING_ID}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING}
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS.map((topic) => (
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
                  href={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HELP_RETURN.href}
                  data-testid="help-impact-preview-vs-envelope-return-to-help"
                >
                  {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HELP_RETURN.label} →
                </Link>
              </p>
            </section>

            <SponsorSendPathHonestyPanel testIdPrefix="help-impact-preview-vs-envelope" showSsoOptional={false} />
          </div>

          <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
        </div>
      </div>
    </article>
  );
}
