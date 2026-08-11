import { HelpEvidenceIntakeAcceptedFormatsTable } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeAcceptedFormatsTable";
import { HelpEvidenceIntakePathStrip } from "@/app/(operator)/help/_sections/HelpEvidenceIntakePathStrip";
import { HelpEvidenceIntakeRelatedGuidesLinks } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeRelatedGuidesLinks";
import { HelpEvidenceIntakeVerifyIntakePanel } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeVerifyIntakePanel";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { EvidenceIntakeHelpClaimDisciplineStrip } from "@/components/help/EvidenceIntakeHelpClaimDisciplineStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { EVIDENCE_INTAKE_HELP_PRIMARY_ACTION } from "@/lib/evidence-intake-help-evidence-copy";
import { EVIDENCE_INTAKE_HELP_HERO_OVERVIEW } from "@/lib/evidence-intake-help-guide-content";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpEvidenceIntakeGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Wizard companion for `/help/evidence-intake` (TB-1350). */
export function HelpEvidenceIntakeGuideView(props: HelpEvidenceIntakeGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-evidence-intake-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicMarkdownPageHeader
        entry={entry}
        showContextualHelp
        primaryAction={EVIDENCE_INTAKE_HELP_PRIMARY_ACTION}
      />

      <div
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid="help-evidence-intake-first-viewport"
      >
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="help-evidence-intake-overview">
          {EVIDENCE_INTAKE_HELP_HERO_OVERVIEW}
        </p>

        <HelpEvidenceIntakeAcceptedFormatsTable />

        <div className={cn("min-w-0", HELP_PAGE_LAYOUT.contentColumn)} data-testid="help-evidence-intake-reference">
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
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")} data-testid="help-evidence-intake-secondary">
          <HelpEvidenceIntakePathStrip />
          <HelpEvidenceIntakeVerifyIntakePanel />
          <EvidenceIntakeHelpClaimDisciplineStrip />

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
              Related guides
            </h2>
            <div className="mt-2">
              <HelpEvidenceIntakeRelatedGuidesLinks />
            </div>
          </section>
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
      </div>
    </article>
  );
}
