import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { PriorManifestRetrievalHelpEvidenceOrientationStrip } from "@/components/help/PriorManifestRetrievalHelpEvidenceOrientationStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_OVERVIEW,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_SUBTITLE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_TITLE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PATH,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS,
} from "@/lib/prior-manifest-retrieval-help-guide-content";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED,
  PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_HEADING,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX,
  PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_HEADING,
  PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/prior-manifest-retrieval-help-ia-dual";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_TEST_ID } from "@/lib/prior-manifest-retrieval-help-related-guides";
import { cn } from "@/lib/utils";

type HelpPriorManifestRetrievalGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Specialty Ask-memory orientation for `/help/prior-manifest-retrieval` (TB-1731). */
export function HelpPriorManifestRetrievalGuideView(
  props: HelpPriorManifestRetrievalGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-prior-manifest-retrieval-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_TITLE}
        titleTestId="help-prior-manifest-retrieval-page-title"
        subtitle={PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_SUBTITLE}
        navHref={PRIOR_MANIFEST_RETRIEVAL_HELP_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-prior-manifest-retrieval-header-actions"
          >
            <Button
              asChild
              size="sm"
              variant="primary"
              data-testid="help-prior-manifest-retrieval-open-ask"
            >
              <Link href={PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.href}>
                {PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.architecturePackages.href}>
                {PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.architecturePackages.label}
              </Link>
            </Button>
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <PriorManifestRetrievalHelpEvidenceOrientationStrip />

      <section
        aria-labelledby="help-prior-manifest-retrieval-job-matrix-heading"
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid={PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_TEST_ID}
      >
        <h2
          id="help-prior-manifest-retrieval-job-matrix-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_HEADING}
        </h2>
        <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
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

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-prior-manifest-retrieval-overview">
            {PRIOR_MANIFEST_RETRIEVAL_HELP_OVERVIEW}
          </p>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-prior-manifest-retrieval-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
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
                    className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link, OPERATOR_LINK.inline)}
                  >
                    {guide.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
