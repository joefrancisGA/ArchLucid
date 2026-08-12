import Link from "next/link";

import { HelpEvidenceTrailFindingJumpPanel } from "@/app/(operator)/help/_sections/HelpEvidenceTrailFindingJumpPanel";
import { HelpEvidenceTrailRelatedGuidesLinks } from "@/app/(operator)/help/_sections/HelpEvidenceTrailRelatedGuidesLinks";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { EvidenceTrailHelpEvidenceOrientationStrip } from "@/components/help/EvidenceTrailHelpEvidenceOrientationStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  EVIDENCE_TRAIL_HELP_ACTION_PANEL_TITLE,
  EVIDENCE_TRAIL_HELP_HERO_OVERVIEW,
  EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS,
  EVIDENCE_TRAIL_HELP_SAMPLE_HONESTY,
} from "@/lib/evidence-trail-help-guide-content";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-evidence-trail-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicMarkdownPageHeader
        entry={entry}
        showContextualHelp
        primaryAction={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openGraph}
      />

      <div
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid="help-evidence-trail-first-viewport"
      >
        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-evidence-trail-overview"
        >
          {EVIDENCE_TRAIL_HELP_HERO_OVERVIEW}
        </p>

        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-evidence-trail-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {EVIDENCE_TRAIL_HELP_ACTION_PANEL_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openGraph.href}>
                {EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openGraph.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link
                href={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.loadGraph.href}
                data-testid={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.loadGraph.testId}
              >
                {EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.loadGraph.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link
                href={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openSampleGraph.href}
                data-testid={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openSampleGraph.testId}
              >
                {EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openSampleGraph.label}
              </Link>
            </Button>
            <p
              className={cn("m-0 w-full text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-evidence-trail-sample-honesty"
            >
              {EVIDENCE_TRAIL_HELP_SAMPLE_HONESTY}
            </p>
          </CardContent>
        </Card>

        <HelpEvidenceTrailFindingJumpPanel />
        <EvidenceTrailHelpEvidenceOrientationStrip />
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn)} data-testid="help-topic-content">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
            preparedMarkdownOverride={preparedMarkdown}
          />

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
              Related guides
            </h2>
            <div className="mt-2">
              <HelpEvidenceTrailRelatedGuidesLinks />
            </div>
          </section>
        </div>

        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
