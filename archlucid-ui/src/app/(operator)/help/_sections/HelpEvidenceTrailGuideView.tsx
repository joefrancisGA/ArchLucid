import { HelpEvidenceTrailActionPanel } from "@/app/(operator)/help/_sections/HelpEvidenceTrailActionPanel";
import { HelpEvidenceTrailFindingJumpPanel } from "@/app/(operator)/help/_sections/HelpEvidenceTrailFindingJumpPanel";
import { HelpEvidenceTrailRelatedGuidesLinks } from "@/app/(operator)/help/_sections/HelpEvidenceTrailRelatedGuidesLinks";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { EvidenceTrailHelpClaimDisciplineStrip } from "@/components/help/EvidenceTrailHelpClaimDisciplineStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  buildEvidenceTrailHelpTocHeadings,
  EVIDENCE_TRAIL_HELP_HERO_OVERVIEW,
  EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS,
  EVIDENCE_TRAIL_HELP_RELATED_GUIDES_TITLE,
} from "@/lib/evidence-trail-help-guide-content";
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

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-evidence-trail-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicMarkdownPageHeader
        entry={entry}
        showContextualHelp
        primaryAction={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openGraph}
      />

      <EvidenceTrailHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")} data-testid="help-evidence-trail-primary">
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-evidence-trail-overview"
          >
            {EVIDENCE_TRAIL_HELP_HERO_OVERVIEW}
          </p>

          <div className="space-y-6" data-testid="help-evidence-trail-first-viewport">
            <HelpEvidenceTrailActionPanel />
            <HelpEvidenceTrailFindingJumpPanel />

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
    </article>
  );
}
