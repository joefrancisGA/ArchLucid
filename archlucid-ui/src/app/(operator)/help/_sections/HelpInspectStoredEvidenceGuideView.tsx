"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { HelpInspectStoredEvidenceBreadcrumb } from "@/app/(operator)/help/_sections/HelpInspectStoredEvidenceBreadcrumb";
import { HelpInspectStoredEvidenceHeaderActions } from "@/app/(operator)/help/_sections/HelpInspectStoredEvidenceHeaderActions";
import { HelpInspectStoredEvidenceTechnicalReference } from "@/app/(operator)/help/_sections/HelpInspectStoredEvidenceTechnicalReference";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
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
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_GUIDED,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_SECURENOW,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_WORKING,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CITATION_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_DOWNLOAD_ONLY_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW_LEAD,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PREVIEW_KEYBOARD_INTRO,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PREVIEW_KEYBOARD_ROWS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RECORD_PRACTICE_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_LINKS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS_HEADING,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS_HEADING_ID,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_STATUS_TAG,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_TITLE,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SCOPE_NAV_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING_ID,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TITLE,
} from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CLAIM_DISCIPLINE,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_HEADING_ID,
} from "@/lib/evidence-source-inspect-help-stored-evidence-evidence-copy";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_FIRST_VIEWPORT_TEST_ID,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_TEST_ID,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_CONTENT_ID,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_LINK_LABEL,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_TARGET_ID,
} from "@/lib/evidence-source-inspect-help-stored-evidence-page-copy";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH } from "@/lib/evidence-source-inspect-help-stored-evidence-route";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RETURN_TO_REVIEW_EVIDENCE_LABEL,
  resolveInspectStoredEvidenceHelpReturnHref,
} from "@/lib/evidence-source-inspect-help-stored-evidence-return";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpInspectStoredEvidenceGuideViewProps = {
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

/** ESI-08 — inspect stored evidence on the review Evidence tab. */
export function HelpInspectStoredEvidenceGuideView(
  props: HelpInspectStoredEvidenceGuideViewProps,
): React.ReactElement {
  void props.markdown;
  const { entry } = props;
  const searchParams = useSearchParams();
  const returnToReviewEvidenceHref = resolveInspectStoredEvidenceHelpReturnHref(
    searchParams.get("returnTo") ?? undefined,
  );
  const contentGridClass = resolveHelpPageContentGridClass(
    EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS.length,
  );
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_TEST_ID}
    >
      <a
        href={`#${EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <div
        id={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_CONTENT_ID}
        data-testid={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-4", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpInspectStoredEvidenceBreadcrumb />

        {returnToReviewEvidenceHref !== null ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <Link
              className={OPERATOR_LINK.inline}
              href={returnToReviewEvidenceHref}
              data-testid="help-inspect-stored-evidence-return-to-review-evidence"
            >
              {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RETURN_TO_REVIEW_EVIDENCE_LABEL}
            </Link>
          </p>
        ) : null}

        <HelpTopicGuidePageHeader
          title={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TITLE}
          titleTestId="help-inspect-stored-evidence-page-title"
          subtitle={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE}
          subtitleClassName="max-w-3xl"
          navHref={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH}
          headingLevel="h1"
          claimDiscipline={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CLAIM_DISCIPLINE}
          claimDisciplineTestId={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
          actions={<HelpInspectStoredEvidenceHeaderActions />}
        />

        <div
          id={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_TARGET_ID}
          data-testid={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_FIRST_VIEWPORT_TEST_ID}
          className={cn("scroll-mt-24 space-y-4", OPERATOR_LAYOUT.sectionStack)}
        >
          <p className={readingBodyClass} data-testid="help-inspect-stored-evidence-overview">
            {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW_LEAD}
          </p>

          <section
            aria-labelledby={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_HEADING_ID}
            className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-inspect-stored-evidence-safety-callout"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_HEADING_ID}
                className={cn(
                  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                  "m-0 scroll-mt-24 text-al-text-primary",
                  OPERATOR_TYPOGRAPHY.sectionTitle,
                )}
              >
                {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_TITLE}
              </h2>
              <StatusTag
                kind="neutral"
                label={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_STATUS_TAG}
                data-testid="help-inspect-stored-evidence-safety-status-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-inspect-stored-evidence-safety-detail"
            >
              {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_BODY}
            </p>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            <section
              aria-labelledby="help-inspect-stored-evidence-applicability"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inspect-stored-evidence-applicability"
            >
              <HelpSectionHeading id="help-inspect-stored-evidence-applicability">
                Scope and seat applicability
              </HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-inspect-stored-evidence-seat-working">
                {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_WORKING}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-inspect-stored-evidence-seat-guided"
              >
                {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_GUIDED}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-inspect-stored-evidence-seat-securenow"
              >
                {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_SECURENOW}
              </p>
              <p
                className={cn(readingBodyClass, "text-al-text-secondary")}
                data-testid="help-inspect-stored-evidence-record-practice"
              >
                {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RECORD_PRACTICE_BODY}
              </p>
            </section>

            <section
              aria-labelledby="help-inspect-stored-evidence-controls"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inspect-stored-evidence-controls"
            >
              <HelpSectionHeading id="help-inspect-stored-evidence-controls">
                Open vs Download on stored-file rows
              </HelpSectionHeading>
              <p className={readingBodyClass}>{EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_BODY}</p>
            </section>

            <section
              aria-labelledby="help-inspect-stored-evidence-download-only"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inspect-stored-evidence-download-only"
            >
              <HelpSectionHeading id="help-inspect-stored-evidence-download-only">
                Download-only and unsafe inline types
              </HelpSectionHeading>
              <p className={readingBodyClass}>{EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_DOWNLOAD_ONLY_BODY}</p>
            </section>

            <section
              aria-labelledby="help-inspect-stored-evidence-citation-only"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inspect-stored-evidence-citation-only"
            >
              <HelpSectionHeading id="help-inspect-stored-evidence-citation-only">Citation-only rows</HelpSectionHeading>
              <p className={readingBodyClass}>{EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CITATION_BODY}</p>
            </section>

            <section
              aria-labelledby="help-inspect-stored-evidence-audit"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inspect-stored-evidence-audit"
            >
              <HelpSectionHeading id="help-inspect-stored-evidence-audit">
                Authority and audit recording
              </HelpSectionHeading>
              <p className={readingBodyClass}>{EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_BODY}</p>
              <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-inspect-stored-evidence-scope-nav">
                {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SCOPE_NAV_BODY}
              </p>
            </section>

            <section
              aria-labelledby="help-inspect-stored-evidence-preview-keyboard"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inspect-stored-evidence-preview-keyboard"
            >
              <HelpSectionHeading id="help-inspect-stored-evidence-preview-keyboard">
                Preview dialog keyboard behavior
              </HelpSectionHeading>
              <p className={readingBodyClass}>{EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PREVIEW_KEYBOARD_INTRO}</p>
              <div className="max-w-3xl overflow-x-auto">
                <table
                  className={cn("w-full border-collapse text-left", HELP_PAGE_LAYOUT.readingBody)}
                  data-testid="help-inspect-stored-evidence-preview-keyboard-table"
                >
                  <caption className="sr-only">Stored-file preview dialog keyboard shortcuts</caption>
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Keys</th>
                      <th scope="col" className="py-2 font-medium text-al-text-primary">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PREVIEW_KEYBOARD_ROWS.map((row) => (
                      <tr
                        key={row.keys}
                        className="border-b border-neutral-100 dark:border-neutral-800/80"
                      >
                        <th scope="row" className="py-2 pr-4 font-medium text-al-text-primary">{row.keys}</th>
                        <td className="py-2 text-al-text-secondary">{row.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              aria-labelledby={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpInspectStoredEvidenceTechnicalReference />
            </section>

            <section
              aria-labelledby={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS_HEADING_ID}
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-inspect-stored-evidence-related-topics"
            >
              <HelpSectionHeading id={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS_HEADING_ID}>
                {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS_HEADING}
              </HelpSectionHeading>
              <ul className={cn("m-0 list-none space-y-3 p-0", HELP_PAGE_LAYOUT.readingBody)}>
                {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_LINKS.map((link) => (
                  <li key={link.href} className="max-w-3xl">
                    <Link className={OPERATOR_LINK.nav} href={link.href}>
                      {link.label}
                    </Link>
                    {link.description !== undefined ? (
                      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {link.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <HelpTopicTableOfContents
            headings={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS}
            enableScrollSpy
          />
        </div>
      </div>
    </article>
  );
}
