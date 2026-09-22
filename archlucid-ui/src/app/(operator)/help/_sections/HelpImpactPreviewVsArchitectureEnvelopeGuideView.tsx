"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpImpactPreviewVsArchitectureEnvelopeBreadcrumb } from "@/app/(operator)/help/_sections/HelpImpactPreviewVsArchitectureEnvelopeBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicSectionCopyLink } from "@/components/help/HelpTopicSectionCopyLink";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { Badge } from "@/components/ui/badge";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SAFETY_DESK_LINK,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SAFETY_SECURITY_TRUST_LINK,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-evidence-copy";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_REFERENCES,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_GUIDED,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_SECURENOW,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_WORKING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARE_USE_FOOTNOTE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_BODY,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_HEADING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_BODY,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_TITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_STATUS_CHIP,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_BODY,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_HEADING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SECURENOW_APPLICABILITY_TAG,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_IDENTIFIERS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_HEADING,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_HEADING_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_INTRO,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TOC_JUMP_HINT,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-guide-content";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_FIRST_VIEWPORT_TEST_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_TEST_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PRIMARY_CONTENT_ID,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_LINK_LABEL,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_TARGET_ID,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-page-copy";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RETURN_TO_DESK_LABEL,
  resolveImpactPreviewVsEnvelopeHelpReturnHref,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-return";
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
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpImpactPreviewVsArchitectureEnvelopeGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  /** Registry markdown is not rendered — guided view owns the body (TB-2238). */
  readonly markdown?: string;
};

function HelpTechnicalCode(props: { readonly children: string }): React.ReactElement {
  return (
    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
      {props.children}
    </code>
  );
}

function HelpImpactPreviewVsEnvelopeProvenanceLine(props: {
  readonly entry: ProductDocumentationEntry;
}): React.ReactElement | null {
  const lastReviewed = props.entry.lastReviewed?.trim() ?? "";

  if (lastReviewed.length === 0) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
      data-testid="help-topic-registry-provenance"
    >
      Guide last reviewed {lastReviewed}
    </p>
  );
}

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
    <div className="group flex flex-wrap items-center gap-2">
      {heading}
      <a
        href={`#${props.id}`}
        className={cn(
          "rounded-sm px-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
          OPERATOR_LINK.optional,
          OPERATOR_TYPOGRAPHY.label,
        )}
        aria-label={`Link to ${props.children}`}
        data-testid={`help-impact-preview-vs-envelope-section-anchor-${props.id}`}
      >
        #
      </a>
      <HelpTopicSectionCopyLink sectionId={props.id} sectionTitle={props.children} />
    </div>
  );
}

function renderModeRelationBody(): React.ReactElement {
  const marker = "Which mode am I in?";
  const segments = CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_BODY.split(marker);

  if (segments.length < 2) {
    return <p className={cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}>{CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_BODY}</p>;
  }

  return (
    <p className={cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}>
      {segments[0]}
      <Link className={OPERATOR_LINK.inline} href={MODE_GRAVITY_HELP_WHICH_MODE_PATH}>
        {marker}
      </Link>
      {segments.slice(1).join(marker)}
    </p>
  );
}

function renderRecordPracticeBody(): React.ReactElement {
  const marker = "Which mode am I in?";
  const segments = CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_BODY.split(marker);

  if (segments.length < 2) {
    return (
      <p className={cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}>
        {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_BODY}
      </p>
    );
  }

  return (
    <p className={cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}>
      {segments[0]}
      <Link className={OPERATOR_LINK.inline} href={MODE_GRAVITY_HELP_WHICH_MODE_PATH}>
        {marker}
      </Link>
      {segments.slice(1).join(marker)}
    </p>
  );
}

/** CE-020 / EIM — impact preview vs architecture sketch envelope on the Working desk. */
export function HelpImpactPreviewVsArchitectureEnvelopeGuideView(
  props: HelpImpactPreviewVsArchitectureEnvelopeGuideViewProps,
): React.ReactElement {
  void props.markdown;
  const { entry } = props;
  const { productLine } = useProductLine();
  const secureNowShell = isSecureNowProductLine(productLine);
  const searchParams = useSearchParams();
  const returnToDeskHref = resolveImpactPreviewVsEnvelopeHelpReturnHref(searchParams.get("returnTo") ?? undefined);
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-impact-preview-vs-architecture-envelope",
    CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS,
    CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const impactPreviewPath = CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS[0];
  const sketchPath = CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS[1];

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
        <HelpImpactPreviewVsArchitectureEnvelopeBreadcrumb />

        {returnToDeskHref !== null ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <Link
              className={OPERATOR_LINK.inline}
              href={returnToDeskHref}
              data-testid="help-impact-preview-vs-envelope-return-to-desk"
            >
              {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RETURN_TO_DESK_LABEL}
            </Link>
          </p>
        ) : null}

        <HelpTopicGuidePageHeader
          title={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE}
          titleTestId="help-impact-preview-vs-envelope-page-title"
          subtitle={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE}
          navHref={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH}
          headingLevel="h1"
          claimDiscipline={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE}
          claimDisciplineTestId={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          metadata={<HelpImpactPreviewVsEnvelopeProvenanceLine entry={entry} />}
        />

        <div
          id={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_TARGET_ID}
          data-testid={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          {secureNowShell ? (
            <div
              className="flex max-w-3xl flex-wrap items-center gap-2"
              data-testid="help-impact-preview-vs-envelope-securenow-callout"
            >
              <Badge
                variant="metadata"
                data-testid="help-impact-preview-vs-envelope-securenow-tag"
              >
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SECURENOW_APPLICABILITY_TAG}
              </Badge>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_SECURENOW}
              </p>
            </div>
          ) : null}

          <p className={readingBodyClass} data-testid="help-impact-preview-vs-envelope-overview">
            {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD}
          </p>

          <section
            aria-labelledby="help-impact-preview-vs-envelope-comparison"
            className="space-y-3"
            data-testid="help-impact-preview-vs-envelope-comparison"
          >
            <HelpSectionHeading id="help-impact-preview-vs-envelope-comparison" showPermalink>
              Impact preview vs Sketch a change
            </HelpSectionHeading>
            <div className={HELP_PAGE_LAYOUT.compactTableWrap}>
              <table
                className={cn("w-full min-w-[32rem] border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}
                data-testid="help-impact-preview-vs-envelope-comparison-table"
              >
                <caption className="sr-only">
                  Impact preview policy envelope vs Sketch a change architecture envelope
                </caption>
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>Aspect</th>
                    <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>Impact preview</th>
                    <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>Sketch a change</th>
                  </tr>
                </thead>
                <tbody>
                  {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS.map((row, index) => (
                    <tr
                      key={row.aspect}
                      className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
                      data-testid={`help-impact-preview-vs-envelope-comparison-row-${row.aspect.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.aspect}</th>
                      <td className={cn(HELP_PAGE_LAYOUT.tableBodyCell, "text-al-text-secondary")}>{row.impactPreview}</td>
                      <td className={cn(HELP_PAGE_LAYOUT.tableBodyCell, "text-al-text-secondary")}>{row.sketchAChange}</td>
                    </tr>
                  ))}
                  <tr
                    className={HELP_PAGE_LAYOUT.tableRowOdd}
                    data-testid="help-impact-preview-vs-envelope-comparison-row-open"
                  >
                    <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>Open</th>
                    <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                      {impactPreviewPath !== undefined ? (
                        <p className="m-0 space-y-1">
                          <span className="block text-al-text-secondary">{impactPreviewPath.detail}</span>
                          <span className="block">
                            <Link className={OPERATOR_LINK.nav} href={impactPreviewPath.helpHref}>
                              Help topic
                            </Link>
                            {" · "}
                            <Link
                              className={OPERATOR_LINK.nav}
                              href={impactPreviewPath.workspaceHref}
                              data-testid="help-impact-preview-vs-envelope-open-impact-preview"
                            >
                              {secureNowShell
                                ? impactPreviewPath.secureNowWorkspaceLinkLabel
                                : impactPreviewPath.workspaceLinkLabel}
                            </Link>
                          </span>
                        </p>
                      ) : null}
                    </td>
                    <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                      {sketchPath !== undefined ? (
                        <p className="m-0 space-y-1">
                          <span className="block text-al-text-secondary">{sketchPath.detail}</span>
                          <span className="block">
                            <Link className={OPERATOR_LINK.nav} href={sketchPath.helpHref}>
                              Help topic
                            </Link>
                            {" · "}
                            <Link
                              className={OPERATOR_LINK.nav}
                              href={sketchPath.workspaceHref}
                              data-testid="help-impact-preview-vs-envelope-open-sketch-reviews"
                            >
                              {secureNowShell
                                ? sketchPath.secureNowWorkspaceLinkLabel
                                : sketchPath.workspaceLinkLabel}
                            </Link>
                          </span>
                        </p>
                      ) : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p
              className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-impact-preview-vs-envelope-compare-footnote"
            >
              {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARE_USE_FOOTNOTE}
            </p>
          </section>

          <section
            aria-labelledby={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID}
            className={cn(
              "max-w-3xl space-y-3 rounded-md border border-neutral-200 border-l-4 border-l-neutral-700 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:border-l-neutral-400 dark:bg-neutral-900/40",
            )}
            data-testid="help-impact-preview-vs-envelope-safety-callout"
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
              <Badge
                variant="metadata"
                data-testid="help-impact-preview-vs-envelope-policy-status-chip"
              >
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_STATUS_CHIP}
              </Badge>
            </div>
            <p
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-impact-preview-vs-envelope-safety-detail"
            >
              {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_NOTE_BODY}{" "}
              Open{" "}
              <Link
                className={OPERATOR_LINK.inline}
                href={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SAFETY_DESK_LINK.href}
              >
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SAFETY_DESK_LINK.label}
              </Link>{" "}
              or{" "}
              <Link
                className={OPERATOR_LINK.inline}
                href={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SAFETY_SECURITY_TRUST_LINK.href}
              >
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SAFETY_SECURITY_TRUST_LINK.label}
              </Link>{" "}
              before briefing sponsors.
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
              <HelpSectionHeading id="help-impact-preview-vs-envelope-applicability" showPermalink>
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
              {!secureNowShell ? (
                <p
                  className={cn(readingBodyClass, "text-al-text-secondary")}
                  data-testid="help-impact-preview-vs-envelope-seat-securenow"
                >
                  {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_SECURENOW}
                </p>
              ) : null}
            </section>

            <section
              aria-labelledby="help-impact-preview-vs-envelope-record-practice"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-record-practice"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-record-practice" showPermalink>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_HEADING}
              </HelpSectionHeading>
              {renderRecordPracticeBody()}
            </section>

            <section
              aria-labelledby="help-impact-preview-vs-envelope-mode-relation"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-mode-relation"
            >
              <HelpSectionHeading id="help-impact-preview-vs-envelope-mode-relation" showPermalink>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_HEADING}
              </HelpSectionHeading>
              {renderModeRelationBody()}
            </section>

            <section
              aria-labelledby={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-technical-mapping"
            >
              <HelpSectionHeading
                id={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_HEADING_ID}
                showPermalink
              >
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_HEADING}
              </HelpSectionHeading>
              <p className={readingBodyClass}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_MAPPING_INTRO}
              </p>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_IDENTIFIERS.map((identifier) => (
                  <li key={identifier.id} className="text-al-text-secondary">
                    <span className="font-medium text-al-text-primary">{identifier.id}</span>
                    <span className="text-al-text-secondary"> — {identifier.definition}</span>
                  </li>
                ))}
              </ul>
              <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_REFERENCES.map((adr) => (
                  <li key={adr.id} className="text-al-text-secondary">
                    <span className="font-medium text-al-text-primary">ADR {adr.id}</span>
                    <span className="text-al-text-secondary">
                      {" "}
                      —{" "}
                      <Link className={OPERATOR_LINK.inline} href={adr.inAppHref}>
                        {adr.inAppLabel}
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Technical reference:{" "}
                <HelpTechnicalCode>{CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ADR_REFERENCES[0]?.path}</HelpTechnicalCode>
              </p>
            </section>

            <section
              aria-labelledby={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-impact-preview-vs-envelope-related-topics"
            >
              <HelpSectionHeading
                id={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING_ID}
                showPermalink
              >
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS_HEADING}
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-3 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS.map((topic) => (
                  <li key={topic.href} className="max-w-3xl">
                    <Link className={OPERATOR_LINK.nav} href={topic.href}>
                      {topic.label}
                    </Link>
                    {topic.description !== undefined ? (
                      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {topic.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <SponsorSendPathHonestyPanel testIdPrefix="help-impact-preview-vs-envelope" showSsoOptional={false} />
          </div>

          <div className="space-y-3">
            <p
              className={cn("m-0 hidden text-al-text-secondary xl:block", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-impact-preview-vs-envelope-toc-jump-hint"
            >
              {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TOC_JUMP_HINT}
            </p>
            <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
          </div>
        </div>
      </div>
    </article>
  );
}
