"use client";

import Link from "next/link";
import { HelpExecutiveSummaryPageHeader } from "@/app/(operator)/help/_sections/HelpExecutiveSummaryPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ExecutiveSummaryHelpEvidenceOrientationStrip } from "@/components/help/ExecutiveSummaryHelpEvidenceOrientationStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EXECUTIVE_SUMMARY_HELP_OVERVIEW,
  EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS,
  executiveSummaryHelpPageSubtitle,
} from "@/lib/executive-summary-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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
import { cn } from "@/lib/utils";

type HelpExecutiveSummaryGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe executive summary orientation for `/help/executive-summary`. */
export function HelpExecutiveSummaryGuideView(
  props: HelpExecutiveSummaryGuideViewProps,
): React.JSX.Element {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";

  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-executive-summary-guide"
    >
      <HelpTopicHashScroll />

      <HelpExecutiveSummaryPageHeader
        entry={entry}
        subtitle={executiveSummaryHelpPageSubtitle(buyerPolishedShell)}
      />

      <ExecutiveSummaryHelpEvidenceOrientationStrip />

      <div className="space-y-4">
        <Card data-testid="help-executive-summary-action-panel">
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Open sponsor outputs
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.openExecutiveValueReport.href}>
                {EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.openExecutiveValueReport.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.openExecutiveDashboard.href}>
                {EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.openExecutiveDashboard.label}
              </Link>
            </Button>
            <Link
              href={EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.pilotRoiModel.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.pilotRoiModel.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-executive-summary-overview">
            {EXECUTIVE_SUMMARY_HELP_OVERVIEW}
          </p>

          <div
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-executive-summary-content"
          >
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
