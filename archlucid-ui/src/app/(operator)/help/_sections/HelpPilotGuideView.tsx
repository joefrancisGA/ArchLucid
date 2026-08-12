import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { PilotGuideHelpEvidenceOrientationStrip } from "@/components/help/PilotGuideHelpEvidenceOrientationStrip";
import { PilotGuideGettingStartedFirstReviewVocabularyRail } from "@/components/PilotGuideGettingStartedFirstReviewVocabularyRail";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  PILOT_GUIDE_HELP_OVERVIEW,
  PILOT_GUIDE_HELP_PAGE_SUBTITLE,
  PILOT_GUIDE_HELP_PAGE_TITLE,
  PILOT_GUIDE_HELP_PATH,
  PILOT_GUIDE_HELP_PRIMARY_ACTIONS,
} from "@/lib/pilot-guide-help-guide-content";
import { cn } from "@/lib/utils";

type HelpPilotGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Specialty pilot orientation for `/help/pilot-guide` (HP). */
export function HelpPilotGuideView(props: HelpPilotGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-pilot-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={PILOT_GUIDE_HELP_PAGE_TITLE}
        titleTestId="help-pilot-guide-page-title"
        subtitle={PILOT_GUIDE_HELP_PAGE_SUBTITLE}
        navHref={PILOT_GUIDE_HELP_PATH}
        headingLevel="h1"
        metadata={
          <div className="space-y-2">
            <HelpTopicRegistryProvenanceLine entry={entry} />
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1"
              data-testid="help-pilot-guide-related-links"
            >
              <Link
                href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.href}
                className={cn(
                  "text-sm underline-offset-2 hover:underline",
                  DESIGN_TOKENS.accent.link,
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.label}
              </Link>
              <Link
                href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.gettingStarted.href}
                className={cn(
                  "text-sm underline-offset-2 hover:underline",
                  DESIGN_TOKENS.accent.link,
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.gettingStarted.label}
              </Link>
            </div>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-pilot-guide-header-actions">
            <Button asChild size="sm" variant="primary" data-testid="help-pilot-guide-start-review">
              <Link href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.startReview.href}>
                {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.startReview.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href}>
                {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label}
              </Link>
            </Button>
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <PilotGuideGettingStartedFirstReviewVocabularyRail currentSurfaceId="pilot-guide" />
      <PilotGuideHelpEvidenceOrientationStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-pilot-guide-overview">
            {PILOT_GUIDE_HELP_OVERVIEW}
          </p>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-pilot-guide-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
