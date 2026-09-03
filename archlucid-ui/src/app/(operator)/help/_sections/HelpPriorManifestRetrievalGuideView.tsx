import Link from "next/link";

import { HelpPriorManifestRetrievalClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpPriorManifestRetrievalClaimOrientationStrip";
import { HelpPriorManifestRetrievalHeaderActions } from "@/app/(operator)/help/_sections/HelpPriorManifestRetrievalHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { appendHelpClaimDisciplineTocHeadings, extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_CANONICAL_PATH,
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_HEADING_ID,
  PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED,
  PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_HEADING,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX,
  PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_HEADING,
  PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/prior-manifest-retrieval-help-ia-dual";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_OVERVIEW,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_SUBTITLE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_TITLE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS,
} from "@/lib/prior-manifest-retrieval-help-guide-content";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_FIRST_VIEWPORT_TEST_ID,
  PRIOR_MANIFEST_RETRIEVAL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_CONTENT_ID,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SKIP_LINK_LABEL,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SKIP_TARGET_ID,
} from "@/lib/prior-manifest-retrieval-help-page-copy";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_TEST_ID } from "@/lib/prior-manifest-retrieval-help-related-guides";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpPriorManifestRetrievalGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Specialty Ask-memory orientation for `/help/prior-manifest-retrieval` (HPR). */
export function HelpPriorManifestRetrievalGuideView(
  props: HelpPriorManifestRetrievalGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const markdownHeadings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headings = resolveGuideHeadingsForStrip(
    "help-prior-manifest-retrieval",
    appendHelpClaimDisciplineTocHeadings(markdownHeadings, PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_HEADING_ID),
    PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-prior-manifest-retrieval-guide"
    >
      <a href={`#${PRIOR_MANIFEST_RETRIEVAL_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {PRIOR_MANIFEST_RETRIEVAL_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_CONTENT_ID}
        data-testid={PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_TITLE}
          titleTestId="help-prior-manifest-retrieval-page-title"
          subtitle={PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_SUBTITLE}
          navHref={PRIOR_MANIFEST_RETRIEVAL_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={PRIOR_MANIFEST_RETRIEVAL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={<HelpPriorManifestRetrievalHeaderActions entry={entry} />}
        />

        <div
          id={PRIOR_MANIFEST_RETRIEVAL_HELP_SKIP_TARGET_ID}
          data-testid={PRIOR_MANIFEST_RETRIEVAL_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-prior-manifest-retrieval-overview">
            {PRIOR_MANIFEST_RETRIEVAL_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-prior-manifest-retrieval-action-panel"
            aria-labelledby="help-prior-manifest-retrieval-action-panel-heading"
          >
            <h2
              id="help-prior-manifest-retrieval-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Open live Ask
            </h2>
            <Button asChild size="sm" variant="primary" data-testid="help-prior-manifest-retrieval-open-ask-panel">
              <Link href={PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.href}>
                {PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.label}
              </Link>
            </Button>
          </section>

          <section
            aria-labelledby="help-prior-manifest-retrieval-job-matrix-heading"
            data-testid={PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_TEST_ID}
          >
            <h2
              id="help-prior-manifest-retrieval-job-matrix-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_HEADING}
            </h2>
            <ul className={cn("m-0 mt-3 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX.map((row) => (
                <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                  {row.isCurrent === true ? (
                    <span
                      className="shrink-0 font-medium text-al-text-primary"
                      data-testid="help-prior-manifest-retrieval-job-matrix-current"
                    >
                      {row.label}
                    </span>
                  ) : (
                    <Link className={cn(OPERATOR_LINK.inline, "shrink-0 font-medium")} href={row.href ?? "#"}>
                      {row.label}
                    </Link>
                  )}
                  <span className="text-al-text-secondary">{row.when}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className={contentGridClass}>
            <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
              <div data-testid="help-prior-manifest-retrieval-content">
                <MarketingAccessibilityMarkdownFragment
                  markdownBody={markdown}
                  tableCaption={`${entry.title} reference table`}
                  presentation="help"
                  sourceDocPath={sourceDocPath}
                  helpTopicSlug={entry.slug}
                  preparedMarkdownOverride={preparedMarkdown}
                />
              </div>

              <section
                aria-labelledby="help-prior-manifest-retrieval-related-heading"
                className="space-y-2 border-t border-neutral-200 pt-6 dark:border-neutral-800"
                data-testid={PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_TEST_ID}
              >
                <h2
                  id="help-prior-manifest-retrieval-related-heading"
                  className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
                >
                  {PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_HEADING}
                </h2>
                <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
                  {PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED.map((guide) => (
                    <li key={guide.href}>
                      <Link
                        href={guide.href}
                        className={cn(
                          "underline-offset-2 hover:underline",
                          DESIGN_TOKENS.accent.link,
                          OPERATOR_LINK.inline,
                        )}
                      >
                        {guide.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
          </div>
        </div>

        <div data-testid="help-prior-manifest-retrieval-orientation-bottom">
          <HelpPriorManifestRetrievalClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
