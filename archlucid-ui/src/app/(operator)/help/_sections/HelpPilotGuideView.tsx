import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { PilotGuideHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/PilotGuideHelpEvidenceOrientationStrip";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
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
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-pilot-guide-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <PilotGuideHelpEvidenceOrientationStrip />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-pilot-guide-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Start or continue the pilot
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link
                href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.startReview.href}
                data-testid="help-pilot-guide-start-review"
              >
                {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.startReview.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href}>
                {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label}
              </Link>
            </Button>
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
          </CardContent>
        </Card>
      </div>

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
