import { HelpEvidenceTrailActionPanel } from "@/app/(operator)/help/_sections/HelpEvidenceTrailActionPanel";
import { HelpEvidenceTrailClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpEvidenceTrailClaimOrientationStrip";
import { HelpEvidenceTrailFindingJumpPanel } from "@/app/(operator)/help/_sections/HelpEvidenceTrailFindingJumpPanel";
import { HelpEvidenceTrailHeaderActions } from "@/app/(operator)/help/_sections/HelpEvidenceTrailHeaderActions";
import { HelpEvidenceTrailRelatedGuidesLinks } from "@/app/(operator)/help/_sections/HelpEvidenceTrailRelatedGuidesLinks";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  EVIDENCE_TRAIL_HELP_CANONICAL_PATH,
  EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE,
} from "@/lib/evidence-trail-help-evidence-copy";
import {
  buildEvidenceTrailHelpTocHeadings,
  EVIDENCE_TRAIL_HELP_DIAGRAM_SOURCE,
  EVIDENCE_TRAIL_HELP_DIAGRAM_SUMMARY,
  EVIDENCE_TRAIL_HELP_HERO_OVERVIEW,
  EVIDENCE_TRAIL_HELP_RELATED_GUIDES_TITLE,
} from "@/lib/evidence-trail-help-guide-content";
import {
  EVIDENCE_TRAIL_HELP_FIRST_VIEWPORT_TEST_ID,
  EVIDENCE_TRAIL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  EVIDENCE_TRAIL_HELP_PRIMARY_CONTENT_ID,
  EVIDENCE_TRAIL_HELP_SKIP_LINK_LABEL,
  EVIDENCE_TRAIL_HELP_SKIP_TARGET_ID,
} from "@/lib/evidence-trail-help-page-copy";
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

type HelpEvidenceTrailGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Specialty companion for `/help/evidence-trail` (TB-1360). */
export function HelpEvidenceTrailGuideView(props: HelpEvidenceTrailGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const markdownHeadings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headings = buildEvidenceTrailHelpTocHeadings(markdownHeadings);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-evidence-trail-guide"
    >
      <a href={`#${EVIDENCE_TRAIL_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {EVIDENCE_TRAIL_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={EVIDENCE_TRAIL_HELP_PRIMARY_CONTENT_ID}
        data-testid={EVIDENCE_TRAIL_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={entry.title}
          titleTestId="help-topic-page-title"
          subtitle={entry.summary}
          navHref={EVIDENCE_TRAIL_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={EVIDENCE_TRAIL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={<HelpEvidenceTrailHeaderActions entry={entry} />}
        />

        <div
          id={EVIDENCE_TRAIL_HELP_SKIP_TARGET_ID}
          data-testid={EVIDENCE_TRAIL_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-evidence-trail-overview">
            {EVIDENCE_TRAIL_HELP_HERO_OVERVIEW}
          </p>

          <HelpEvidenceTrailActionPanel />
          <HelpEvidenceTrailFindingJumpPanel />

          <section
            aria-labelledby="help-evidence-trail-provenance-diagram-heading"
            className="space-y-3"
            data-testid="help-evidence-trail-provenance-diagram"
          >
            <h2
              id="help-evidence-trail-provenance-diagram-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              How evidence connects
            </h2>
            <p className={cn("m-0", readingBodyClass)}>{EVIDENCE_TRAIL_HELP_DIAGRAM_SUMMARY}</p>
            <div
              className={cn(
                "space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="help-evidence-trail-mermaid-diagram"
            >
              <MermaidDiagram
                source={EVIDENCE_TRAIL_HELP_DIAGRAM_SOURCE}
                accessibleName="Evidence provenance flow diagram"
              />
            </div>
          </section>

          <div className="min-w-0" data-testid="help-topic-content">
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

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")} data-testid="help-evidence-trail-primary">
            <section
              aria-labelledby="help-evidence-trail-related-heading"
              className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
              data-testid="help-evidence-trail-related-guides"
              id="related-guides"
            >
              <h2
                id="help-evidence-trail-related-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                {EVIDENCE_TRAIL_HELP_RELATED_GUIDES_TITLE}
              </h2>
              <div className="mt-2">
                <HelpEvidenceTrailRelatedGuidesLinks />
              </div>
            </section>
          </div>

          {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
        </div>

        <div data-testid="help-evidence-trail-orientation-bottom">
          <HelpEvidenceTrailClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
