import { HelpEvidenceIntakeAcceptedFormatsTable } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeAcceptedFormatsTable";
import { HelpEvidenceIntakeClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeClaimOrientationStrip";
import { HelpEvidenceIntakeFindingCoverageTable } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeFindingCoverageTable";
import { HelpEvidenceIntakeHeaderActions } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeHeaderActions";
import { HelpEvidenceIntakePathStrip } from "@/app/(operator)/help/_sections/HelpEvidenceIntakePathStrip";
import { HelpEvidenceIntakeRelatedGuidesLinks } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeRelatedGuidesLinks";
import { HelpEvidenceIntakeVerifyIntakePanel } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeVerifyIntakePanel";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ExtractUploadCloudConnectionsVocabularyRail } from "@/components/ExtractUploadCloudConnectionsVocabularyRail";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  EVIDENCE_INTAKE_HELP_CANONICAL_PATH,
  EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE,
} from "@/lib/evidence-intake-help-evidence-copy";
import {
  buildEvidenceIntakeHelpTocHeadings,
  EVIDENCE_INTAKE_HELP_HERO_OVERVIEW,
  EVIDENCE_INTAKE_HELP_PAGE_TITLE,
  EVIDENCE_INTAKE_HELP_RELATED_GUIDES_TITLE,
} from "@/lib/evidence-intake-help-guide-content";
import {
  EVIDENCE_INTAKE_HELP_FIRST_VIEWPORT_TEST_ID,
  EVIDENCE_INTAKE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  EVIDENCE_INTAKE_HELP_PRIMARY_CONTENT_ID,
  EVIDENCE_INTAKE_HELP_SKIP_LINK_LABEL,
  EVIDENCE_INTAKE_HELP_SKIP_TARGET_ID,
} from "@/lib/evidence-intake-help-page-copy";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpEvidenceIntakeGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Wizard companion for `/help/evidence-intake` (TB-1350). */
export function HelpEvidenceIntakeGuideView(props: HelpEvidenceIntakeGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const markdownHeadings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headings = buildEvidenceIntakeHelpTocHeadings(markdownHeadings);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-evidence-intake-guide"
    >
      <a href={`#${EVIDENCE_INTAKE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {EVIDENCE_INTAKE_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={EVIDENCE_INTAKE_HELP_PRIMARY_CONTENT_ID}
        data-testid={EVIDENCE_INTAKE_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={EVIDENCE_INTAKE_HELP_PAGE_TITLE}
          titleTestId="help-topic-page-title"
          subtitle={entry.summary}
          navHref={EVIDENCE_INTAKE_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={EVIDENCE_INTAKE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={<HelpEvidenceIntakeHeaderActions entry={entry} />}
        />

        <div
          id={EVIDENCE_INTAKE_HELP_SKIP_TARGET_ID}
          data-testid={EVIDENCE_INTAKE_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-evidence-intake-overview">
            {EVIDENCE_INTAKE_HELP_HERO_OVERVIEW}
          </p>

          <HelpEvidenceIntakePathStrip />
          <HelpEvidenceIntakeAcceptedFormatsTable />

          <div className="min-w-0" data-testid="help-evidence-intake-reference">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preparedMarkdownOverride={preparedMarkdown}
            />
          </div>
        </div>

        {buyerPolishedShell ? null : (
          <ExtractUploadCloudConnectionsVocabularyRail currentSurfaceId="extract-upload" />
        )}

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")} data-testid="help-evidence-intake-primary">
            <HelpEvidenceIntakeVerifyIntakePanel />
            <HelpEvidenceIntakeFindingCoverageTable />

            <section
              aria-labelledby="help-evidence-intake-related-heading"
              className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
              data-testid="help-evidence-intake-related-guides"
              id="related-guides"
            >
              <h2
                id="help-evidence-intake-related-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                {EVIDENCE_INTAKE_HELP_RELATED_GUIDES_TITLE}
              </h2>
              <div className="mt-2">
                <HelpEvidenceIntakeRelatedGuidesLinks />
              </div>
            </section>
          </div>

          {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
        </div>

        <div data-testid="help-evidence-intake-orientation-bottom">
          <HelpEvidenceIntakeClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
